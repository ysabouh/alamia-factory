<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Products;

use App\Application\Products\ProductBomService;
use App\Domain\Factory\Enums\BomComponentType;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductBom;
use App\Interfaces\Http\Support\SerializesProducts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class ProductBomController
{
    use SerializesProducts;

    public function __construct(
        private readonly ProductBomService $bom,
    ) {}

    public function index(Product $product): JsonResponse
    {
        $lines = $this->bom->flatLines($product->id);

        return response()->json([
            'data' => $lines->map(fn (ProductBom $b) => $this->serializeBomLinePublic($b))->values(),
        ]);
    }

    public function tree(Product $product): JsonResponse
    {
        $tree = $this->bom->tree($product->id);
        $cost = $this->bom->costRollup($product->id);

        return response()->json([
            'data' => [
                'tree' => $tree,
                'costRollup' => $cost,
            ],
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        try {
            $data = $this->validatedLine($request);
            $line = $this->bom->addLine($product->id, $data);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeBomLinePublic($line->load(['childProduct', 'unit']))], 201);
    }

    public function update(Request $request, ProductBom $productBom): JsonResponse
    {
        try {
            $line = $this->bom->updateLine($productBom, $this->validatedLine($request, false));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeBomLinePublic($line)]);
    }

    public function destroy(ProductBom $productBom): JsonResponse
    {
        $this->bom->deleteLine($productBom);

        return response()->json(null, 204);
    }

    public function explode(Product $product, Request $request): JsonResponse
    {
        $qty = (float) $request->query('quantity', 1);

        return response()->json([
            'data' => $this->bom->explode($product->id, $qty),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedLine(Request $request, bool $requireQty = true): array
    {
        $rules = [
            'childProductId' => ['sometimes', 'integer', 'exists:products,id'],
            'materialProductId' => ['sometimes', 'integer', 'exists:products,id'],
            'quantity' => [$requireQty ? 'required' : 'sometimes', 'numeric', 'min:0.0001'],
            'unitId' => ['nullable', 'integer', 'exists:units,id'],
            'componentType' => ['nullable', Rule::enum(BomComponentType::class)],
            'wastePercentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'isOptional' => ['nullable', 'boolean'],
            'sequenceOrder' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string'],
        ];

        return $request->validate($rules);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeBomLinePublic(ProductBom $line): array
    {
        return $this->serializeBomLine($line);
    }
}
