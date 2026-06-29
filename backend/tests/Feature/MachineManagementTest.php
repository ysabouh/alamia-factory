<?php

namespace Tests\Feature;

use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class MachineManagementTest extends TestCase
{
    use RefreshDatabase;

    private function adminWithPermissions(): User
    {
        $user = User::factory()->create();
        foreach ([
            'machines.view',
            'machines.manage',
            'machines.record_counters',
            'machines.manage_maintenance',
            'machines.update_status',
        ] as $perm) {
            Permission::findOrCreate($perm, 'web');
        }
        $user->givePermissionTo([
            'machines.view',
            'machines.manage',
            'machines.record_counters',
            'machines.manage_maintenance',
            'machines.update_status',
        ]);

        return $user;
    }

    public function test_can_create_injection_machine_with_spec(): void
    {
        $user = $this->adminWithPermissions();
        $type = MachineType::create(['code' => 'injection', 'name' => 'حقن', 'is_active' => true]);

        $response = $this->actingAs($user)->postJson('/api/v1/machines', [
            'machineTypeId' => $type->id,
            'code' => 'INJ-99',
            'name' => 'ماكينة حقن تجريبية',
            'status' => 'stopped',
            'spec' => [
                'clampingForceTon' => 350,
                'shotWeightGram' => 120,
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.code', 'INJ-99')
            ->assertJsonPath('data.spec.clampingForceTon', 350);

        $this->assertDatabaseHas('injection_machine_specs', [
            'clamping_force_ton' => 350,
            'shot_weight_gram' => 120,
        ]);
    }

    public function test_can_upsert_counter_and_open_breakdown_ticket(): void
    {
        $user = $this->adminWithPermissions();
        $type = MachineType::create(['code' => 'blow', 'name' => 'نفخ', 'is_active' => true]);
        $machine = Machine::create([
            'machine_type_id' => $type->id,
            'code' => 'BLW-99',
            'name' => 'نفخ تجريبي',
            'status' => 'running',
            'is_active' => true,
        ]);

        $this->actingAs($user)->postJson("/api/v1/machines/{$machine->id}/counters", [
            'counterDate' => now()->toDateString(),
            'producedUnits' => 500,
            'rejectedUnits' => 12,
            'runningHours' => 7.5,
        ])->assertCreated()
            ->assertJsonPath('data.producedUnits', 500);

        $this->actingAs($user)->postJson("/api/v1/machines/{$machine->id}/tickets", [
            'ticketKind' => 'breakdown',
            'title' => 'توقف ضاغط الهواء',
            'description' => 'انخفاض ضغط',
        ])->assertCreated()
            ->assertJsonPath('data.ticketKind', 'breakdown');

        $this->assertDatabaseHas('maintenance_tickets', [
            'machine_id' => $machine->id,
            'ticket_kind' => 'breakdown',
            'title' => 'توقف ضاغط الهواء',
        ]);
    }

    public function test_status_patch_uses_new_enum_values(): void
    {
        $user = $this->adminWithPermissions();
        $type = MachineType::create(['code' => 'injection', 'name' => 'حقن', 'is_active' => true]);
        $machine = Machine::create([
            'machine_type_id' => $type->id,
            'code' => 'INJ-02',
            'name' => 'حقن 2',
            'status' => 'stopped',
            'is_active' => true,
        ]);

        $this->actingAs($user)->patchJson("/api/v1/machines/{$machine->id}/status", [
            'status' => 'running',
            'statusNote' => 'بدء وردية',
        ])->assertOk()
            ->assertJsonPath('data.status', 'running');

        $this->assertDatabaseHas('machines', [
            'id' => $machine->id,
            'status' => 'running',
        ]);
    }

    public function test_can_upload_machine_image(): void
    {
        $user = $this->adminWithPermissions();
        $type = MachineType::create(['code' => 'injection', 'name' => 'حقن', 'is_active' => true]);
        $machine = Machine::create([
            'machine_type_id' => $type->id,
            'code' => 'IMG-01',
            'name' => 'ماكينة صور',
            'status' => 'stopped',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->postJson("/api/v1/machines/{$machine->id}/images", [
            'image' => \Illuminate\Http\UploadedFile::fake()->image('machine.jpg'),
            'isPrimary' => true,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.isPrimary', true);

        $machine->refresh();
        $this->assertNotNull($machine->image_url);
        $this->assertDatabaseHas('machine_images', [
            'machine_id' => $machine->id,
            'is_primary' => true,
        ]);
    }
}
