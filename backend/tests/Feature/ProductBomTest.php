<?php

namespace Tests\Feature;

use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductBom;
use App\Domain\Factory\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ProductBomTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['products.view', 'products.manage'] as $perm) {
            Permission::findOrCreate($perm, 'web');
        }

        $user = User::factory()->create(['is_active' => true]);
        $user->givePermissionTo(['products.view', 'products.manage']);
        Sanctum::actingAs($user);
    }

    public function test_bom_tree_and_circular_prevention(): void
    {
        $jar = Product::query()->create([
            'product_code' => 'JAR-ASM',
            'sku' => 'JAR-ASM',
            'product_name_ar' => 'برطمان مجمّع',
            'assembly_type' => 'assembly',
            'product_type' => 'finished_good',
            'product_status' => 'active',
            'is_active' => true,
        ]);
        $body = Product::query()->create([
            'product_code' => 'JAR-BODY',
            'sku' => 'JAR-BODY',
            'product_name_ar' => 'جسم البرطمان',
            'assembly_type' => 'component',
            'product_type' => 'semi_finished',
            'product_status' => 'active',
            'is_active' => true,
        ]);
        $lid = Product::query()->create([
            'product_code' => 'JAR-LID',
            'sku' => 'JAR-LID',
            'product_name_ar' => 'غطاء البرطمان',
            'assembly_type' => 'component',
            'product_type' => 'semi_finished',
            'product_status' => 'active',
            'is_active' => true,
        ]);

        $this->postJson("/api/v1/products/{$jar->id}/bom", [
            'childProductId' => $body->id,
            'quantity' => 1,
            'componentType' => 'component',
        ])->assertCreated();

        $this->postJson("/api/v1/products/{$jar->id}/bom", [
            'childProductId' => $lid->id,
            'quantity' => 1,
            'componentType' => 'component',
        ])->assertCreated();

        $this->getJson("/api/v1/products/{$jar->id}/bom-tree")
            ->assertOk()
            ->assertJsonCount(2, 'data.tree');

        ProductBom::query()->create([
            'product_id' => $body->id,
            'child_product_id' => $lid->id,
            'quantity' => 1,
            'component_type' => 'component',
        ]);

        $this->getJson("/api/v1/products/{$jar->id}/bom-tree")
            ->assertOk()
            ->assertJsonPath('data.tree.0.children.0.childProductId', (string) $lid->id);

        $this->postJson("/api/v1/products/{$jar->id}/bom", [
            'childProductId' => $jar->id,
            'quantity' => 1,
        ])->assertStatus(422);
    }
}
