<?php

namespace Tests\Feature;

use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ProductRoutingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::findOrCreate('products.view', 'web');
        Permission::findOrCreate('products.manage', 'web');

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->givePermissionTo(['products.view', 'products.manage']);
        Sanctum::actingAs($this->admin);
    }

    public function test_hybrid_product_supports_bom_and_manufacturing_operations(): void
    {
        $resin = Product::query()->create([
            'product_code' => 'RM-PP',
            'sku' => 'RM-PP',
            'product_name_ar' => 'حبيبات PP',
            'product_type' => 'raw_material',
            'product_status' => 'active',
            'is_active' => true,
        ]);

        $cap = Product::query()->create([
            'product_code' => 'CAP-001',
            'sku' => 'CAP-001',
            'product_name_ar' => 'غطاء زجاجة',
            'product_type' => 'finished_good',
            'manufacturing_type' => 'injection',
            'product_status' => 'active',
            'is_active' => true,
        ]);

        $this->postJson("/api/v1/products/{$cap->id}/bom", [
            'childProductId' => $resin->id,
            'quantity' => 0.05,
            'componentType' => 'raw_material',
        ])->assertCreated();

        $machineType = MachineType::query()->create([
            'code' => 'injection',
            'name' => 'حقن',
            'is_active' => true,
        ]);

        $machine = Machine::query()->create([
            'machine_type_id' => $machineType->id,
            'code' => 'INJ-01',
            'name' => 'ماكينة حقن 1',
            'status' => 'stopped',
            'is_active' => true,
        ]);

        $mold = Mold::query()->create([
            'product_id' => $cap->id,
            'code' => 'MLD-CAP',
            'name' => 'قالب غطاء',
            'mold_type' => 'injection',
            'status' => 'active',
            'is_active' => true,
        ]);

        $this->postJson("/api/v1/products/{$cap->id}/operations", [
            'operationCode' => 'INJ-10',
            'operationName' => 'حقن الغطاء',
            'operationType' => 'injection',
            'sequenceOrder' => 10,
            'machineId' => $machine->id,
            'moldId' => $mold->id,
            'cycleTime' => 18,
            'qcRequired' => true,
            'machineSettings' => [[
                'machineId' => $machine->id,
                'injectionPressure' => 120,
                'holdingPressure' => 80,
                'shotWeight' => 12.5,
            ]],
            'qualitySpecs' => [[
                'inspectionType' => 'weight',
                'toleranceMin' => 11.5,
                'toleranceMax' => 13.5,
            ]],
        ])->assertCreated();

        $this->getJson("/api/v1/products/{$cap->id}")
            ->assertOk()
            ->assertJsonPath('data.manufacturingMode', 'hybrid')
            ->assertJsonCount(1, 'data.bom')
            ->assertJsonCount(1, 'data.operations');

        $routing = $this->getJson("/api/v1/products/{$cap->id}/routing")
            ->assertOk()
            ->assertJsonPath('data.manufacturingMode', 'hybrid')
            ->assertJsonPath('data.bomComponentCount', 1)
            ->assertJsonPath('data.operationCount', 1);

        $flow = $routing->json('data.flow');
        $this->assertSame('materials', $flow[0]['kind']);
        $this->assertSame('operation', $flow[1]['kind']);
        $this->assertNotEmpty($routing->json('data.machineParameters'));
        $this->assertNotEmpty($routing->json('data.qcSpecifications'));
    }

    public function test_assembled_product_has_bom_without_manufacturing_operations(): void
    {
        $body = Product::query()->create([
            'product_code' => 'BODY-01',
            'sku' => 'BODY-01',
            'product_name_ar' => 'جسم زجاجة',
            'product_type' => 'semi_finished',
            'product_status' => 'active',
            'is_active' => true,
        ]);

        $cap = Product::query()->create([
            'product_code' => 'CAP-02',
            'sku' => 'CAP-02',
            'product_name_ar' => 'غطاء',
            'product_type' => 'semi_finished',
            'product_status' => 'active',
            'is_active' => true,
        ]);

        $bottle = Product::query()->create([
            'product_code' => 'BTL-FULL',
            'sku' => 'BTL-FULL',
            'product_name_ar' => 'زجاجة كاملة',
            'product_type' => 'finished_good',
            'assembly_type' => 'assembly',
            'product_status' => 'active',
            'is_active' => true,
        ]);

        $this->postJson("/api/v1/products/{$bottle->id}/bom", [
            'childProductId' => $body->id,
            'quantity' => 1,
            'componentType' => 'component',
        ])->assertCreated();

        $this->postJson("/api/v1/products/{$bottle->id}/bom", [
            'childProductId' => $cap->id,
            'quantity' => 1,
            'componentType' => 'component',
        ])->assertCreated();

        $this->postJson("/api/v1/products/{$bottle->id}/operations", [
            'operationCode' => 'ASM-10',
            'operationName' => 'تجميع الزجاجة',
            'operationType' => 'assembly',
            'sequenceOrder' => 10,
        ])->assertCreated();

        $this->getJson("/api/v1/products/{$bottle->id}/routing")
            ->assertOk()
            ->assertJsonPath('data.manufacturingMode', 'assembled')
            ->assertJsonPath('data.operationCount', 1);
    }

    public function test_rejects_assembly_operation_before_manufacturing_in_sequence(): void
    {
        $product = Product::query()->create([
            'product_code' => 'HYB-01',
            'sku' => 'HYB-01',
            'product_name_ar' => 'منتج هجين',
            'product_type' => 'finished_good',
            'product_status' => 'active',
            'is_active' => true,
        ]);

        $this->postJson("/api/v1/products/{$product->id}/operations", [
            'operationCode' => 'ASM-10',
            'operationName' => 'تجميع',
            'operationType' => 'assembly',
            'sequenceOrder' => 10,
        ])->assertCreated();

        $machineType = MachineType::query()->create([
            'code' => 'injection',
            'name' => 'حقن',
            'is_active' => true,
        ]);

        $machine = Machine::query()->create([
            'machine_type_id' => $machineType->id,
            'code' => 'INJ-99',
            'name' => 'حقن',
            'status' => 'stopped',
            'is_active' => true,
        ]);

        $mold = Mold::query()->create([
            'product_id' => $product->id,
            'code' => 'MLD-99',
            'name' => 'قالب',
            'mold_type' => 'injection',
            'status' => 'active',
            'is_active' => true,
        ]);

        $this->postJson("/api/v1/products/{$product->id}/operations", [
            'operationCode' => 'INJ-20',
            'operationName' => 'حقن',
            'operationType' => 'injection',
            'sequenceOrder' => 20,
            'machineId' => $machine->id,
            'moldId' => $mold->id,
        ])->assertStatus(422);
    }
}
