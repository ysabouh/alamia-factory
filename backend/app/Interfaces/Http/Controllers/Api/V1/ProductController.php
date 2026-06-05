<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Products\ProductService;
use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Enums\AssemblyType;
use App\Domain\Factory\Enums\ManufacturingMode;
use App\Domain\Factory\Enums\ManufacturingType;
use App\Domain\Factory\Enums\ProductStatus;
use App\Domain\Factory\Enums\ProductType;
use App\Domain\Factory\Models\Product;
use App\Interfaces\Http\Support\SerializesProducts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController
{
    use SerializesProducts;

    public function __construct(
        private readonly ProductService $products,
        private readonly MasterQuery $masterQuery,
    ) {}

    public function masters(): JsonResponse
    {
        $data = $this->products->masters();

        return response()->json([
            'data' => [
                'categories' => collect($data['categories'])->map(fn ($c) => [
                    'id' => (string) $c->id,
                    'categoryCode' => $c->category_code,
                    'categoryNameAr' => $c->category_name_ar,
                    'categoryNameEn' => $c->category_name_en,
                    'parentId' => $c->parent_id ? (string) $c->parent_id : null,
                ])->values(),
                'materials' => collect($data['materials'])->map(fn ($m) => [
                    'id' => (string) $m->id,
                    'materialCode' => $m->material_code,
                    'materialName' => $m->material_name,
                ])->values(),
                'colors' => collect($data['colors'])->map(fn ($c) => [
                    'id' => (string) $c->id,
                    'colorCode' => $c->color_code,
                    'colorName' => $c->color_name,
                    'hexColor' => $c->hex_color,
                ])->values(),
                'units' => collect($data['units'])->map(fn ($u) => [
                    'id' => (string) $u->id,
                    'unitCode' => $u->unit_code,
                    'unitNameAr' => $u->unit_name_ar,
                    'symbol' => $u->symbol,
                ])->values(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $meta = $this->masterQuery->paginateMeta($request, 0);
        $paginator = $this->products->paginate($request->query(), $meta['page'], $meta['pageSize']);
        $meta['total'] = $paginator->total();
        $meta['totalPages'] = $paginator->lastPage();

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Product $p) => $this->serializeProduct($p))->values(),
            'meta' => $meta,
        ]);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'data' => $this->serializeProduct($this->products->findDetail($product->id), true),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $product = $this->products->create($this->validated($request));

        return response()->json(['data' => $this->serializeProduct($product, true)], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $product = $this->products->update($product, $this->validated($request, false));

        return response()->json(['data' => $this->serializeProduct($product, true)]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->products->delete($product);

        return response()->json(null, 204);
    }

    public function bom(Product $product): JsonResponse
    {
        $detail = $this->products->findDetail($product->id);

        return response()->json([
            'data' => $detail->bomLines->map(fn ($b) => [
                'id' => (string) $b->id,
                'materialProductId' => (string) $b->material_product_id,
                'materialProductCode' => $b->materialProduct?->product_code ?? $b->materialProduct?->code,
                'materialProductName' => $b->materialProduct?->product_name_ar ?? $b->materialProduct?->name,
                'quantity' => $b->quantity,
                'unitId' => $b->unit_id ? (string) $b->unit_id : null,
                'wastePercentage' => $b->waste_percentage,
                'notes' => $b->notes,
            ])->values(),
        ]);
    }

    public function molds(Product $product): JsonResponse
    {
        $detail = $this->products->findDetail($product->id);

        return response()->json([
            'data' => $detail->productMolds->map(fn ($pm) => [
                'id' => (string) $pm->id,
                'moldId' => (string) $pm->mold_id,
                'moldCode' => $pm->mold?->code,
                'moldName' => $pm->mold?->name,
                'priority' => $pm->priority,
                'isDefault' => (bool) $pm->is_default,
                'notes' => $pm->notes,
            ])->values(),
        ]);
    }

    public function machineSettings(Product $product): JsonResponse
    {
        $detail = $this->products->findDetail($product->id);

        return response()->json([
            'data' => $detail->machineSettings->map(fn ($s) => [
                'id' => (string) $s->id,
                'machineId' => (string) $s->machine_id,
                'machineCode' => $s->machine?->code,
                'machineName' => $s->machine?->name,
                'cycleTime' => $s->cycle_time,
                'injectionPressure' => $s->injection_pressure,
                'holdingPressure' => $s->holding_pressure,
                'coolingTime' => $s->cooling_time,
                'moldTemperature' => $s->mold_temperature,
                'barrelTemperatureProfile' => $s->barrel_temperature_profile,
                'shotWeight' => $s->shot_weight,
                'clampForce' => $s->clamp_force,
                'backPressure' => $s->back_pressure,
                'screwSpeed' => $s->screw_speed,
                'setupNotes' => $s->setup_notes,
            ])->values(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $creating = true): array
    {
        $require = $creating ? 'required' : 'sometimes';

        $optionalInts = ['cavityOutput', 'standardCycleTime', 'targetOutputPerHour'];
        $merge = [];
        foreach ($optionalInts as $key) {
            if ($request->has($key)) {
                $val = $request->input($key);
                if ($val === '' || $val === null || $val === 0 || $val === '0') {
                    $merge[$key] = null;
                }
            }
        }
        if ($merge !== []) {
            $request->merge($merge);
        }

        $validated = $request->validate([
            'productCode' => [$require, 'string', 'max:64', Rule::unique('products', 'product_code')->ignore($request->route('product'))],
            'sku' => ['nullable', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($request->route('product'))],
            'barcode' => ['nullable', 'string', 'max:128'],
            'productNameAr' => [$require, 'string', 'max:255'],
            'productNameEn' => ['nullable', 'string', 'max:255'],
            'shortName' => ['nullable', 'string', 'max:120'],
            'categoryId' => ['nullable', 'integer', 'exists:product_categories,id'],
            'productType' => ['nullable', Rule::enum(ProductType::class)],
            'assemblyType' => ['nullable', Rule::enum(AssemblyType::class)],
            'manufacturingMode' => ['nullable', Rule::enum(ManufacturingMode::class)],
            'standardCost' => ['nullable', 'numeric', 'min:0'],
            'manufacturingType' => ['nullable', Rule::enum(ManufacturingType::class)],
            'plasticMaterialId' => ['nullable', 'integer', 'exists:plastic_materials,id'],
            'colorId' => ['nullable', 'integer', 'exists:product_colors,id'],
            'unitId' => ['nullable', 'integer', 'exists:units,id'],
            'productWeight' => ['nullable', 'numeric', 'min:0'],
            'productVolume' => ['nullable', 'numeric', 'min:0'],
            'dimensions' => ['nullable', 'string', 'max:120'],
            'cavityOutput' => ['nullable', 'integer', 'min:1'],
            'standardCycleTime' => ['nullable', 'integer', 'min:0'],
            'targetOutputPerHour' => ['nullable', 'integer', 'min:0'],
            'productStatus' => ['nullable', Rule::enum(ProductStatus::class)],
            'imageUrl' => ['nullable', 'string', 'max:500'],
            'technicalNotes' => ['nullable', 'string'],
            'isActive' => ['nullable', 'boolean'],
            'standardWeightGrams' => ['nullable', 'numeric', 'min:0'],
            'qualitySpec' => ['nullable', 'array'],
            'qualitySpec.weightTolerance' => ['nullable', 'numeric'],
            'qualitySpec.thicknessTolerance' => ['nullable', 'numeric'],
            'qualitySpec.colorTolerance' => ['nullable', 'numeric'],
            'qualitySpec.pressureTestRequired' => ['nullable', 'boolean'],
            'qualitySpec.leakTestRequired' => ['nullable', 'boolean'],
            'qualitySpec.dropTestRequired' => ['nullable', 'boolean'],
            'qualitySpec.visualInspectionRequired' => ['nullable', 'boolean'],
            'qualitySpec.qcNotes' => ['nullable', 'string'],
            'bom' => ['nullable', 'array'],
            'bom.*.materialProductId' => ['required_with:bom', 'integer', 'exists:products,id'],
            'bom.*.quantity' => ['required_with:bom', 'numeric', 'min:0'],
            'bom.*.unitId' => ['nullable', 'integer', 'exists:units,id'],
            'bom.*.wastePercentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'bom.*.notes' => ['nullable', 'string'],
            'molds' => ['nullable', 'array'],
            'molds.*.moldId' => ['required_with:molds', 'integer', 'exists:molds,id'],
            'molds.*.priority' => ['nullable', 'integer', 'min:1', 'max:99'],
            'molds.*.isDefault' => ['nullable', 'boolean'],
            'molds.*.notes' => ['nullable', 'string'],
            'machineSettings' => ['nullable', 'array'],
            'machineSettings.*.machineId' => ['required_with:machineSettings', 'integer', 'exists:machines,id'],
            'machineSettings.*.cycleTime' => ['nullable', 'integer', 'min:0'],
            'machineSettings.*.injectionPressure' => ['nullable', 'numeric'],
            'machineSettings.*.holdingPressure' => ['nullable', 'numeric'],
            'machineSettings.*.coolingTime' => ['nullable', 'integer', 'min:0'],
            'machineSettings.*.moldTemperature' => ['nullable', 'numeric'],
            'machineSettings.*.barrelTemperatureProfile' => ['nullable', 'array'],
            'machineSettings.*.shotWeight' => ['nullable', 'numeric'],
            'machineSettings.*.clampForce' => ['nullable', 'numeric'],
            'machineSettings.*.backPressure' => ['nullable', 'numeric'],
            'machineSettings.*.screwSpeed' => ['nullable', 'integer', 'min:0'],
            'machineSettings.*.setupNotes' => ['nullable', 'string'],
        ]);

        if ($creating && empty($validated['sku'])) {
            $validated['sku'] = $validated['productCode'];
        }

        return $validated;
    }
}
