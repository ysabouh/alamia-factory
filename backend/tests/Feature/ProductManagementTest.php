<?php

namespace Tests\Feature;

use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ProductManagementTest extends TestCase
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

    public function test_can_list_and_create_product_with_nested_data(): void
    {
        $this->getJson('/api/v1/products/masters')->assertOk()->assertJsonStructure([
            'data' => ['categories', 'materials', 'colors', 'units'],
        ]);

        $payload = [
            'productCode' => 'FG-CAP-5L',
            'productNameAr' => 'غطاء 5 لتر',
            'productType' => 'finished_good',
            'manufacturingType' => 'injection',
            'productStatus' => 'active',
            'qualitySpec' => [
                'visualInspectionRequired' => true,
                'weightTolerance' => 0.5,
            ],
        ];

        $create = $this->postJson('/api/v1/products', $payload);
        $create->assertCreated();
        $id = $create->json('data.id');
        $this->assertNotNull($id);

        $this->getJson("/api/v1/products/{$id}")
            ->assertOk()
            ->assertJsonPath('data.productCode', 'FG-CAP-5L')
            ->assertJsonPath('data.qualitySpec.weightTolerance', '0.500');

        $this->patchJson("/api/v1/products/{$id}", [
            'productNameAr' => 'غطاء 5 لتر محدّث',
        ])->assertOk()->assertJsonPath('data.productNameAr', 'غطاء 5 لتر محدّث');

        $this->getJson("/api/v1/products/{$id}/bom")->assertOk();
        $this->getJson("/api/v1/products/{$id}/molds")->assertOk();
        $this->getJson("/api/v1/products/{$id}/machine-settings")->assertOk();
    }

    public function test_legacy_code_field_stays_synced(): void
    {
        $product = Product::query()->create([
            'product_code' => 'LEG-001',
            'sku' => 'LEG-001',
            'product_name_ar' => 'منتج تجريبي',
            'product_type' => 'finished_good',
            'product_status' => 'active',
            'is_active' => true,
        ]);

        $this->assertSame('LEG-001', $product->fresh()->code);
        $this->assertSame('منتج تجريبي', $product->fresh()->name);
    }
}
