<?php

namespace Tests\Feature;

use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class MoldManagementTest extends TestCase
{
    use RefreshDatabase;

    private function adminWithPermissions(): User
    {
        $user = User::factory()->create();
        foreach (['molds.view', 'molds.manage', 'molds.manage_maintenance'] as $perm) {
            Permission::findOrCreate($perm, 'web');
        }
        $user->givePermissionTo(['molds.view', 'molds.manage', 'molds.manage_maintenance']);

        return $user;
    }

    public function test_can_create_injection_mold_with_spec(): void
    {
        $user = $this->adminWithPermissions();
        $product = Product::create(['code' => 'P-01', 'name' => 'منتج', 'unit' => 'piece']);
        $type = MachineType::create(['code' => 'injection', 'name' => 'حقن', 'is_active' => true]);
        $machine = Machine::create([
            'machine_type_id' => $type->id,
            'code' => 'INJ-01',
            'name' => 'حقن',
            'status' => 'stopped',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->postJson('/api/v1/molds', [
            'productId' => $product->id,
            'moldCode' => 'MLD-INJ-01',
            'moldName' => 'قالب حقن تجريبي',
            'moldType' => 'injection',
            'machineId' => $machine->id,
            'cavityCount' => 4,
            'spec' => [
                'hotRunner' => true,
                'clampForceRequired' => 350,
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.moldCode', 'MLD-INJ-01')
            ->assertJsonPath('data.spec.hotRunner', true);

        $this->assertDatabaseHas('injection_molds', [
            'hot_runner' => 1,
            'clamp_force_required' => 350,
        ]);
        $this->assertDatabaseHas('mold_installations', [
            'machine_id' => $machine->id,
        ]);
    }

    public function test_rejects_incompatible_machine_for_pet_blow_mold(): void
    {
        $user = $this->adminWithPermissions();
        $product = Product::create(['code' => 'P-02', 'name' => 'زجاجة', 'unit' => 'piece']);
        $type = MachineType::create(['code' => 'injection', 'name' => 'حقن', 'is_active' => true]);
        $machine = Machine::create([
            'machine_type_id' => $type->id,
            'code' => 'INJ-02',
            'name' => 'حقن',
            'status' => 'stopped',
            'is_active' => true,
        ]);

        $this->actingAs($user)->postJson('/api/v1/molds', [
            'productId' => $product->id,
            'moldCode' => 'MLD-BLW-01',
            'moldName' => 'قالب PET',
            'moldType' => 'pet_blow',
            'machineId' => $machine->id,
        ])->assertStatus(422);
    }

    public function test_can_list_molds_by_type(): void
    {
        $user = $this->adminWithPermissions();
        $product = Product::create(['code' => 'P-03', 'name' => 'غطاء', 'unit' => 'piece']);

        Mold::create([
            'product_id' => $product->id,
            'code' => 'MLD-A',
            'name' => 'قالب A',
            'mold_type' => 'injection',
            'status' => 'active',
            'cavity_count' => 2,
            'is_active' => true,
        ]);
        Mold::create([
            'product_id' => $product->id,
            'code' => 'MLD-B',
            'name' => 'قالب B',
            'mold_type' => 'pet_blow',
            'status' => 'active',
            'cavity_count' => 1,
            'is_active' => true,
        ]);

        $this->actingAs($user)->getJson('/api/v1/molds/by-type/injection')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.moldCode', 'MLD-A');
    }

    public function test_can_create_polyethylene_mold_with_pe_machine(): void
    {
        $user = $this->adminWithPermissions();
        $product = Product::create(['code' => 'P-PE', 'name' => 'خزان PE', 'unit' => 'piece']);
        $type = MachineType::firstOrCreate(
            ['code' => 'pe_rotational'],
            ['name' => 'PE Rotational', 'is_active' => true]
        );
        $machine = Machine::create([
            'machine_type_id' => $type->id,
            'code' => 'PE-ROT-01',
            'name' => 'Rotomould 01',
            'status' => 'stopped',
            'is_active' => true,
        ]);

        $this->actingAs($user)->postJson('/api/v1/molds', [
            'productId' => $product->id,
            'moldCode' => 'MLD-PE-01',
            'moldName' => 'قالب خزان HDPE',
            'moldType' => 'polyethylene',
            'machineId' => $machine->id,
            'spec' => [
                'polyethyleneType' => 'hdpe',
                'productionMethod' => 'rotational',
                'tankVolume' => 5000,
                'wallThickness' => 8.5,
                'minTemperature' => 180,
                'maxTemperature' => 260,
                'rotationalSpeed' => 12,
            ],
        ])->assertCreated()
            ->assertJsonPath('data.moldType', 'polyethylene')
            ->assertJsonPath('data.spec.polyethyleneType', 'hdpe');

        $this->assertDatabaseHas('polyethylene_molds', [
            'polyethylene_type' => 'hdpe',
            'production_method' => 'rotational',
        ]);
    }
}
