<?php

namespace App\Application\Products;

use App\Application\Manufacturing\ManufacturingModeService;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductBom;
use App\Domain\Factory\Models\ProductMachineSetting;
use App\Domain\Factory\Models\ProductMold;
use App\Domain\Factory\Models\ProductQualitySpec;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ProductService
{
    public function __construct(
        private readonly ProductBomService $bomService,
        private readonly ManufacturingModeService $manufacturingMode,
    ) {}
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters, int $page, int $pageSize): LengthAwarePaginator
    {
        $q = $this->filterQuery($filters)
            ->with([
                'category',
                'plasticMaterial',
                'color',
                'measureUnit',
                'images' => fn ($i) => $i->where('is_primary', true)->limit(1),
            ]);

        $sort = (string) ($filters['sort'] ?? 'product_code');
        $dir = strtolower((string) ($filters['sortDir'] ?? 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowed = ['product_code', 'product_name_ar', 'product_type', 'manufacturing_type', 'product_status', 'created_at'];
        if (! in_array($sort, $allowed, true)) {
            $sort = 'product_code';
        }

        return $q->orderBy($sort, $dir)->paginate(perPage: $pageSize, page: $page);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function filterQuery(array $filters): Builder
    {
        $q = Product::query();

        if (! empty($filters['search'])) {
            $term = '%'.trim((string) $filters['search']).'%';
            $q->where(function (Builder $b) use ($term): void {
                $b->where('product_code', 'like', $term)
                    ->orWhere('sku', 'like', $term)
                    ->orWhere('barcode', 'like', $term)
                    ->orWhere('product_name_ar', 'like', $term)
                    ->orWhere('product_name_en', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('name', 'like', $term);
            });
        }

        if (! empty($filters['productType'])) {
            $q->where('product_type', (string) $filters['productType']);
        }

        if (! empty($filters['manufacturingType'])) {
            $q->where('manufacturing_type', (string) $filters['manufacturingType']);
        }

        if (! empty($filters['manufacturingMode'])) {
            $q->where('manufacturing_mode', (string) $filters['manufacturingMode']);
        }

        if (! empty($filters['productStatus'])) {
            $q->where('product_status', (string) $filters['productStatus']);
        }

        if (isset($filters['isActive']) && $filters['isActive'] !== '' && $filters['isActive'] !== 'all') {
            $q->where('is_active', filter_var($filters['isActive'], FILTER_VALIDATE_BOOLEAN));
        }

        if (! empty($filters['categoryId'])) {
            $q->where('category_id', (int) $filters['categoryId']);
        }

        return $q;
    }

    public function findDetail(int $id): Product
    {
        return Product::query()
            ->with([
                'category',
                'plasticMaterial',
                'color',
                'measureUnit',
                'images',
                'documents',
                'bomLines.childProduct.measureUnit',
                'bomLines.unit',
                'qualitySpec',
                'productMolds.mold',
                'machineSettings.machine.type',
                'operations.machine.type',
                'operations.mold',
                'operations.workCenter',
                'operations.machineSettings.machine',
                'operations.materialConsumptions.materialProduct',
                'operations.qualitySpecs',
            ])
            ->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Product
    {
        return DB::transaction(function () use ($data): Product {
            $product = Product::query()->create($this->productAttributes($data));
            $this->syncNested($product, $data);
            $this->manufacturingMode->sync($product->id);

            return $this->findDetail($product->id);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data): Product {
            $product->fill($this->productAttributes($data, false));
            $product->save();
            $this->syncNested($product, $data);
            $this->manufacturingMode->sync($product->id);

            return $this->findDetail($product->id);
        });
    }

    public function delete(Product $product): void
    {
        DB::transaction(function () use ($product): void {
            $this->bomService->assertCanDeleteProduct($product->id);
            $product->delete();
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function masters(): array
    {
        return [
            'categories' => \App\Domain\Factory\Models\ProductCategory::query()
                ->where('is_active', true)->orderBy('category_code')->get(),
            'materials' => \App\Domain\Factory\Models\PlasticMaterial::query()
                ->where('is_active', true)->orderBy('material_code')->get(),
            'colors' => \App\Domain\Factory\Models\ProductColor::query()
                ->where('is_active', true)->orderBy('color_code')->get(),
            'units' => \App\Domain\Factory\Models\Unit::query()
                ->where('is_active', true)->orderBy('unit_code')->get(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function productAttributes(array $data, bool $creating = true): array
    {
        $attrs = [];
        $map = [
            'product_code' => 'productCode',
            'sku' => 'sku',
            'barcode' => 'barcode',
            'product_name_ar' => 'productNameAr',
            'product_name_en' => 'productNameEn',
            'short_name' => 'shortName',
            'category_id' => 'categoryId',
            'product_type' => 'productType',
            'assembly_type' => 'assemblyType',
            'manufacturing_mode' => 'manufacturingMode',
            'manufacturing_type' => 'manufacturingType',
            'plastic_material_id' => 'plasticMaterialId',
            'color_id' => 'colorId',
            'unit_id' => 'unitId',
            'product_weight' => 'productWeight',
            'product_volume' => 'productVolume',
            'dimensions' => 'dimensions',
            'cavity_output' => 'cavityOutput',
            'standard_cycle_time' => 'standardCycleTime',
            'target_output_per_hour' => 'targetOutputPerHour',
            'product_status' => 'productStatus',
            'image_url' => 'imageUrl',
            'technical_notes' => 'technicalNotes',
            'is_active' => 'isActive',
            'tenant_id' => 'tenantId',
            'factory_id' => 'factoryId',
            'branch_id' => 'branchId',
            'standard_weight_grams' => 'standardWeightGrams',
            'standard_cost' => 'standardCost',
        ];

        foreach ($map as $db => $json) {
            if (array_key_exists($json, $data)) {
                $val = $data[$json];
                $attrs[$db] = $val === '' ? null : $val;
            }
        }

        if ($creating && ! isset($attrs['product_code']) && isset($data['code'])) {
            $attrs['product_code'] = $data['code'];
        }

        return $attrs;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncNested(Product $product, array $data): void
    {
        if (array_key_exists('qualitySpec', $data)) {
            $this->syncQualitySpec($product, $data['qualitySpec']);
        }

        if (array_key_exists('bom', $data)) {
            $this->syncBom($product, $data['bom'] ?? []);
        }

        if (array_key_exists('molds', $data)) {
            $this->syncMolds($product, $data['molds'] ?? []);
        }

        if (array_key_exists('machineSettings', $data)) {
            $this->syncMachineSettings($product, $data['machineSettings'] ?? []);
        }
    }

    /**
     * @param  array<string, mixed>|null  $spec
     */
    private function syncQualitySpec(Product $product, ?array $spec): void
    {
        if ($spec === null) {
            ProductQualitySpec::query()->where('product_id', $product->id)->delete();

            return;
        }

        ProductQualitySpec::query()->updateOrCreate(
            ['product_id' => $product->id],
            [
                'weight_tolerance' => $spec['weightTolerance'] ?? null,
                'thickness_tolerance' => $spec['thicknessTolerance'] ?? null,
                'color_tolerance' => $spec['colorTolerance'] ?? null,
                'pressure_test_required' => (bool) ($spec['pressureTestRequired'] ?? false),
                'leak_test_required' => (bool) ($spec['leakTestRequired'] ?? false),
                'drop_test_required' => (bool) ($spec['dropTestRequired'] ?? false),
                'visual_inspection_required' => (bool) ($spec['visualInspectionRequired'] ?? true),
                'qc_notes' => $spec['qcNotes'] ?? null,
            ]
        );
    }

    /**
     * @param  list<array<string, mixed>>  $lines
     */
    private function syncBom(Product $product, array $lines): void
    {
        ProductBom::query()->where('product_id', $product->id)->delete();

        foreach ($lines as $line) {
            $childId = (int) ($line['childProductId'] ?? $line['materialProductId'] ?? 0);
            if ($childId <= 0) {
                continue;
            }
            $this->bomService->assertValidLink($product->id, $childId);
            ProductBom::query()->create([
                'product_id' => $product->id,
                'child_product_id' => $childId,
                'quantity' => (float) ($line['quantity'] ?? 0),
                'unit_id' => ! empty($line['unitId']) ? (int) $line['unitId'] : null,
                'component_type' => $line['componentType'] ?? 'component',
                'waste_percentage' => (float) ($line['wastePercentage'] ?? 0),
                'is_optional' => (bool) ($line['isOptional'] ?? false),
                'sequence_order' => (int) ($line['sequenceOrder'] ?? 1),
                'notes' => $line['notes'] ?? null,
            ]);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function syncMolds(Product $product, array $items): void
    {
        ProductMold::query()->where('product_id', $product->id)->delete();

        foreach ($items as $item) {
            if (empty($item['moldId'])) {
                continue;
            }
            ProductMold::query()->create([
                'product_id' => $product->id,
                'mold_id' => (int) $item['moldId'],
                'priority' => (int) ($item['priority'] ?? 1),
                'is_default' => (bool) ($item['isDefault'] ?? false),
                'notes' => $item['notes'] ?? null,
            ]);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function syncMachineSettings(Product $product, array $items): void
    {
        ProductMachineSetting::query()->where('product_id', $product->id)->delete();

        foreach ($items as $item) {
            if (empty($item['machineId'])) {
                continue;
            }
            ProductMachineSetting::query()->create([
                'product_id' => $product->id,
                'machine_id' => (int) $item['machineId'],
                'cycle_time' => $item['cycleTime'] ?? null,
                'injection_pressure' => $item['injectionPressure'] ?? null,
                'holding_pressure' => $item['holdingPressure'] ?? null,
                'cooling_time' => $item['coolingTime'] ?? null,
                'mold_temperature' => $item['moldTemperature'] ?? null,
                'barrel_temperature_profile' => $item['barrelTemperatureProfile'] ?? null,
                'shot_weight' => $item['shotWeight'] ?? null,
                'clamp_force' => $item['clampForce'] ?? null,
                'back_pressure' => $item['backPressure'] ?? null,
                'screw_speed' => $item['screwSpeed'] ?? null,
                'setup_notes' => $item['setupNotes'] ?? null,
            ]);
        }
    }
}
