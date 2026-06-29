<?php

namespace Tests\Feature;

use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\QualityChecklist;
use App\Domain\Factory\Models\QualityChecklistItem;
use App\Domain\Factory\Models\Shift;
use App\Domain\Factory\Models\User;
use App\Domain\Factory\Models\WorkOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ProductionOrdersTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            'production.manage',
            'production.execute',
            'production.record',
            'production.reports',
            'quality.inspect',
            'quality.manage_checklists',
            'maintenance.open_ticket',
        ] as $perm) {
            Permission::findOrCreate($perm, 'web');
        }

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->givePermissionTo([
            'production.manage',
            'production.execute',
            'production.record',
            'production.reports',
            'quality.inspect',
            'quality.manage_checklists',
            'maintenance.open_ticket',
        ]);
        Sanctum::actingAs($this->admin);
    }

    public function test_full_production_order_lifecycle_with_quality(): void
    {
        [$product, $machine, $mold, $shift, $supervisor] = $this->seedProductionContext();

        $checklist = QualityChecklist::query()->create([
            'product_id' => $product->id,
            'name' => 'فحص الغطاء',
            'is_active' => true,
        ]);
        $weightItem = QualityChecklistItem::query()->create([
            'checklist_id' => $checklist->id,
            'item_name' => 'الوزن',
            'item_type' => 'numeric',
            'min_value' => 18,
            'max_value' => 20,
            'unit' => 'gram',
            'sort_order' => 10,
            'is_critical' => true,
        ]);
        $leakItem = QualityChecklistItem::query()->create([
            'checklist_id' => $checklist->id,
            'item_name' => 'التسريب',
            'item_type' => 'boolean',
            'sort_order' => 20,
            'is_critical' => true,
        ]);

        $create = $this->postJson('/api/v1/production/orders', [
            'productId' => $product->id,
            'machineId' => $machine->id,
            'moldId' => $mold->id,
            'shiftId' => $shift->id,
            'supervisorId' => $supervisor->id,
            'plannedQuantity' => 5000,
            'productionDate' => now()->toDateString(),
        ]);
        $create->assertCreated();
        $orderId = $create->json('data.id');

        $this->postJson("/api/v1/production/orders/{$orderId}/start")->assertOk()
            ->assertJsonPath('data.status', 'running');

        $this->postJson("/api/v1/production/orders/{$orderId}/logs", [
            'fromTime' => now()->subHours(2)->toIso8601String(),
            'toTime' => now()->toIso8601String(),
            'goodQuantity' => 1200,
            'scrapQuantity' => 15,
        ])->assertCreated();

        $this->postJson("/api/v1/production/orders/{$orderId}/inspections", [
            'qualityEmployeeId' => $supervisor->id,
            'isFinal' => true,
            'results' => [
                ['checklistItemId' => $weightItem->id, 'measuredValue' => '19.2'],
                ['checklistItemId' => $leakItem->id, 'measuredValue' => 'true'],
            ],
        ])->assertCreated()->assertJsonPath('data.status', 'passed');

        $this->postJson("/api/v1/production/orders/{$orderId}/complete")->assertOk()
            ->assertJsonPath('data.status', 'completed');
    }

    public function test_cannot_complete_without_final_quality_inspection(): void
    {
        [$product, $machine, $mold, $shift] = $this->seedProductionContext();

        $create = $this->postJson('/api/v1/production/orders', [
            'productId' => $product->id,
            'machineId' => $machine->id,
            'moldId' => $mold->id,
            'shiftId' => $shift->id,
            'plannedQuantity' => 1000,
        ]);
        $orderId = $create->json('data.id');

        $this->postJson("/api/v1/production/orders/{$orderId}/start")->assertOk();
        $this->postJson("/api/v1/production/orders/{$orderId}/complete")->assertStatus(422);
    }

    public function test_failed_critical_inspection_pauses_order(): void
    {
        [$product, $machine, $mold, $shift, $supervisor] = $this->seedProductionContext();

        $checklist = QualityChecklist::query()->create([
            'product_id' => $product->id,
            'name' => 'فحص',
            'is_active' => true,
        ]);
        $item = QualityChecklistItem::query()->create([
            'checklist_id' => $checklist->id,
            'item_name' => 'الوزن',
            'item_type' => 'numeric',
            'min_value' => 18,
            'max_value' => 20,
            'is_critical' => true,
            'sort_order' => 10,
        ]);

        $orderId = $this->postJson('/api/v1/production/orders', [
            'productId' => $product->id,
            'machineId' => $machine->id,
            'moldId' => $mold->id,
            'shiftId' => $shift->id,
            'plannedQuantity' => 500,
        ])->json('data.id');

        $this->postJson("/api/v1/production/orders/{$orderId}/start")->assertOk();

        $this->postJson("/api/v1/production/orders/{$orderId}/inspections", [
            'qualityEmployeeId' => $supervisor->id,
            'results' => [
                ['checklistItemId' => $item->id, 'measuredValue' => '25'],
            ],
        ])->assertCreated()->assertJsonPath('data.status', 'failed');

        $this->assertSame('paused', WorkOrder::query()->find($orderId)?->status?->value);
    }

    public function test_downtime_creates_maintenance_request(): void
    {
        [$product, $machine, $mold, $shift] = $this->seedProductionContext();
        $reasonId = \App\Domain\Factory\Models\DowntimeReason::query()->first()->id;

        $orderId = $this->postJson('/api/v1/production/orders', [
            'productId' => $product->id,
            'machineId' => $machine->id,
            'moldId' => $mold->id,
            'shiftId' => $shift->id,
            'plannedQuantity' => 500,
        ])->json('data.id');

        $downtime = $this->postJson("/api/v1/production/orders/{$orderId}/downtimes", [
            'downtimeReasonId' => $reasonId,
            'startTime' => now()->subMinutes(30)->toIso8601String(),
            'notes' => 'عطل ماكينة',
        ])->assertCreated();

        $downtimeId = $downtime->json('data.id');

        $this->postJson("/api/v1/machine-downtimes/{$downtimeId}/maintenance-request", [
            'issueDescription' => 'عطل محرك الحقن',
            'priority' => 'high',
        ])->assertCreated()->assertJsonStructure(['data' => ['ticketId', 'requestNo']]);
    }

    public function test_downtime_photo_upload(): void
    {
        [$product, $machine, $mold, $shift] = $this->seedProductionContext();
        $reasonId = \App\Domain\Factory\Models\DowntimeReason::query()->first()->id;

        $orderId = $this->postJson('/api/v1/production/orders', [
            'productId' => $product->id,
            'machineId' => $machine->id,
            'moldId' => $mold->id,
            'shiftId' => $shift->id,
            'plannedQuantity' => 500,
        ])->json('data.id');

        $downtimeId = $this->postJson("/api/v1/production/orders/{$orderId}/downtimes", [
            'downtimeReasonId' => $reasonId,
            'startTime' => now()->subMinutes(10)->toIso8601String(),
        ])->json('data.id');

        $this->postJson("/api/v1/machine-downtimes/{$downtimeId}/photos", [
            'photo' => \Illuminate\Http\UploadedFile::fake()->image('fault.jpg'),
        ])->assertCreated()->assertJsonStructure(['data' => ['id', 'filePath', 'fileName']]);

        $this->getJson("/api/v1/production/orders/{$orderId}/downtimes")
            ->assertOk()
            ->assertJsonPath('data.0.photos.0.fileName', 'fault.jpg');
    }

    /**
     * @return array{0: Product, 1: Machine, 2: Mold, 3: Shift, 4: Employee}
     */
    private function seedProductionContext(): array
    {
        $product = Product::query()->create([
            'product_code' => 'CAP-TEST',
            'sku' => 'CAP-TEST',
            'product_name_ar' => 'غطاء تجريبي',
            'product_type' => 'finished_good',
            'product_status' => 'active',
            'is_active' => true,
        ]);

        $type = MachineType::query()->create(['code' => 'injection', 'name' => 'حقن', 'is_active' => true]);
        $machine = Machine::query()->create([
            'machine_type_id' => $type->id,
            'code' => 'INJ-TEST',
            'name' => 'ماكينة تجريبية',
            'status' => 'stopped',
            'is_active' => true,
        ]);

        $mold = Mold::query()->create([
            'product_id' => $product->id,
            'code' => 'MLD-TEST',
            'name' => 'قالب تجريبي',
            'mold_type' => 'injection',
            'status' => 'active',
            'is_active' => true,
        ]);

        $shift = Shift::query()->create([
            'code' => 'SHIFT-TEST',
            'name' => 'وردية تجريبية',
            'starts_at' => '08:00',
            'ends_at' => '16:00',
            'is_active' => true,
        ]);

        $supervisor = Employee::query()->create([
            'code' => 'EMP-QC',
            'name' => 'مراقب جودة',
            'is_active' => true,
        ]);

        return [$product, $machine, $mold, $shift, $supervisor];
    }
}
