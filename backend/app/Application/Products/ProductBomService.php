<?php

namespace App\Application\Products;

use App\Application\Manufacturing\ManufacturingModeService;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductBom;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class ProductBomService
{
    private const MAX_DEPTH = 20;

    public function __construct(
        private readonly ManufacturingModeService $manufacturingMode,
    ) {}

    /**
     * @return Collection<int, ProductBom>
     */
    public function flatLines(int $parentProductId): Collection
    {
        return ProductBom::query()
            ->where('product_id', $parentProductId)
            ->with(['childProduct.measureUnit', 'unit'])
            ->orderBy('sequence_order')
            ->orderBy('id')
            ->get();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function tree(int $parentProductId, int $depth = self::MAX_DEPTH): array
    {
        return $this->buildTreeNodes($parentProductId, $depth, []);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function addLine(int $parentProductId, array $data): ProductBom
    {
        $childId = (int) ($data['childProductId'] ?? $data['materialProductId'] ?? 0);
        $this->assertValidLink($parentProductId, $childId);

        $seq = (int) ($data['sequenceOrder'] ?? (ProductBom::query()->where('product_id', $parentProductId)->max('sequence_order') ?? 0) + 1);

        $line = ProductBom::query()->create([
            'product_id' => $parentProductId,
            'child_product_id' => $childId,
            'quantity' => (float) ($data['quantity'] ?? 1),
            'unit_id' => ! empty($data['unitId']) ? (int) $data['unitId'] : null,
            'component_type' => $data['componentType'] ?? 'component',
            'waste_percentage' => (float) ($data['wastePercentage'] ?? 0),
            'is_optional' => (bool) ($data['isOptional'] ?? false),
            'sequence_order' => $seq,
            'notes' => $data['notes'] ?? null,
        ]);

        $this->manufacturingMode->sync($parentProductId);

        return $line;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateLine(ProductBom $line, array $data): ProductBom
    {
        if (isset($data['childProductId']) || isset($data['materialProductId'])) {
            $childId = (int) ($data['childProductId'] ?? $data['materialProductId']);
            $this->assertValidLink((int) $line->product_id, $childId, (int) $line->id);
            $line->child_product_id = $childId;
        }

        if (array_key_exists('quantity', $data)) {
            $line->quantity = (float) $data['quantity'];
        }
        if (array_key_exists('unitId', $data)) {
            $line->unit_id = $data['unitId'] ? (int) $data['unitId'] : null;
        }
        if (array_key_exists('componentType', $data)) {
            $line->component_type = $data['componentType'];
        }
        if (array_key_exists('wastePercentage', $data)) {
            $line->waste_percentage = (float) $data['wastePercentage'];
        }
        if (array_key_exists('isOptional', $data)) {
            $line->is_optional = (bool) $data['isOptional'];
        }
        if (array_key_exists('sequenceOrder', $data)) {
            $line->sequence_order = (int) $data['sequenceOrder'];
        }
        if (array_key_exists('notes', $data)) {
            $line->notes = $data['notes'];
        }

        $line->save();

        $this->manufacturingMode->sync((int) $line->product_id);

        return $line->fresh(['childProduct', 'unit']);
    }

    public function deleteLine(ProductBom $line): void
    {
        $productId = (int) $line->product_id;
        $line->delete();
        $this->manufacturingMode->sync($productId);
    }

    /**
     * BOM explosion — flatten nested structure with cumulative quantities.
     *
     * @return list<array{productId: int, productCode: string, productName: string, quantity: float, level: int, componentType: string|null}>
     */
    public function explode(int $parentProductId, float $multiplier = 1.0, int $depth = self::MAX_DEPTH): array
    {
        $result = [];
        $this->explodeRecursive($parentProductId, $multiplier, 0, $depth, $result);

        return $result;
    }

    /**
     * @return array{unitCost: float, rolledUpCost: float, lines: list<array<string, mixed>>}
     */
    public function costRollup(int $parentProductId, float $quantity = 1.0): array
    {
        $exploded = $this->explode($parentProductId, $quantity);
        $lines = [];
        $total = 0.0;

        foreach ($exploded as $row) {
            $product = Product::query()->find($row['productId']);
            $unitCost = (float) ($product?->standard_cost ?? 0);
            $lineCost = $unitCost * $row['quantity'];
            $total += $lineCost;
            $lines[] = array_merge($row, [
                'unitCost' => $unitCost,
                'lineCost' => round($lineCost, 4),
            ]);
        }

        $parent = Product::query()->find($parentProductId);
        $parentUnit = (float) ($parent?->standard_cost ?? 0);

        return [
            'unitCost' => $parentUnit,
            'rolledUpCost' => round($total, 4),
            'lines' => $lines,
        ];
    }

    public function assertCanDeleteProduct(int $productId): void
    {
        $usedAsChild = ProductBom::query()->where('child_product_id', $productId)->exists();
        if ($usedAsChild) {
            throw new InvalidArgumentException('لا يمكن حذف منتج مستخدم كمكوّن في BOM.');
        }
    }

    public function assertValidLink(int $parentId, int $childId, ?int $ignoreLineId = null): void
    {
        if ($parentId === $childId) {
            throw new InvalidArgumentException('لا يمكن ربط المنتج بنفسه في BOM.');
        }

        if ($this->wouldCreateCycle($parentId, $childId, $ignoreLineId)) {
            throw new InvalidArgumentException('إضافة هذا المكوّن ستُنشئ مرجعاً دائرياً في BOM.');
        }
    }

    private function wouldCreateCycle(int $parentId, int $childId, ?int $ignoreLineId): bool
    {
        return $this->collectDescendantIds($childId, self::MAX_DEPTH, $ignoreLineId)->contains($parentId);
    }

    /**
     * @return Collection<int, int>
     */
    private function collectDescendantIds(int $productId, int $depth, ?int $ignoreLineId): Collection
    {
        $ids = collect([$productId]);
        if ($depth <= 0) {
            return $ids;
        }

        $childIds = ProductBom::query()
            ->where('product_id', $productId)
            ->when($ignoreLineId, fn ($q) => $q->where('id', '!=', $ignoreLineId))
            ->get()
            ->map(fn (ProductBom $line) => (int) ($line->child_product_id ?? $line->getAttributes()['material_product_id'] ?? 0))
            ->filter(fn (int $id) => $id > 0);

        foreach ($childIds as $cid) {
            $ids = $ids->merge($this->collectDescendantIds((int) $cid, $depth - 1, null));
        }

        return $ids->unique();
    }

    /**
     * @param  list<int>  $visited
     * @return list<array<string, mixed>>
     */
    private function buildTreeNodes(int $parentProductId, int $depth, array $visited): array
    {
        if ($depth <= 0 || in_array($parentProductId, $visited, true)) {
            return [];
        }

        $visited[] = $parentProductId;
        $lines = $this->flatLines($parentProductId);
        $nodes = [];

        foreach ($lines as $line) {
            $child = $line->childProduct;
            if (! $child) {
                continue;
            }
            $childId = (int) $child->id;
            $nodes[] = [
                'id' => (string) $line->id,
                'parentProductId' => (string) $line->product_id,
                'childProductId' => (string) $childId,
                'childProductCode' => $child->product_code ?? $child->code,
                'childProductName' => $child->product_name_ar ?? $child->name,
                'assemblyType' => $child->assembly_type?->value ?? $child->assembly_type,
                'quantity' => $line->quantity,
                'unitId' => $line->unit_id ? (string) $line->unit_id : null,
                'unitName' => $line->unit?->unit_name_ar,
                'componentType' => $line->component_type?->value ?? $line->component_type,
                'wastePercentage' => $line->waste_percentage,
                'isOptional' => (bool) $line->is_optional,
                'sequenceOrder' => $line->sequence_order,
                'notes' => $line->notes,
                'standardCost' => $child->standard_cost,
                'children' => $this->buildTreeNodes($childId, $depth - 1, $visited),
            ];
        }

        return $nodes;
    }

    /**
     * @param  list<array<string, mixed>>  $result
     */
    private function explodeRecursive(int $productId, float $multiplier, int $level, int $depth, array &$result): void
    {
        if ($depth <= 0) {
            return;
        }

        $lines = ProductBom::query()
            ->where('product_id', $productId)
            ->with('childProduct')
            ->orderBy('sequence_order')
            ->get();

        if ($lines->isEmpty() && $level > 0) {
            $product = Product::query()->find($productId);
            if ($product) {
                $result[] = [
                    'productId' => $productId,
                    'productCode' => $product->product_code ?? $product->code,
                    'productName' => $product->product_name_ar ?? $product->name,
                    'quantity' => round($multiplier, 4),
                    'level' => $level,
                    'componentType' => null,
                ];
            }

            return;
        }

        foreach ($lines as $line) {
            if (! $line->childProduct) {
                continue;
            }
            $wasteFactor = 1 + ((float) $line->waste_percentage / 100);
            $qty = $multiplier * (float) $line->quantity * $wasteFactor;
            $childId = (int) $line->child_product_id;

            $hasChildren = ProductBom::query()->where('product_id', $childId)->exists();
            if ($hasChildren) {
                $this->explodeRecursive($childId, $qty, $level + 1, $depth - 1, $result);
            } else {
                $child = $line->childProduct;
                $result[] = [
                    'productId' => $childId,
                    'productCode' => $child->product_code ?? $child->code,
                    'productName' => $child->product_name_ar ?? $child->name,
                    'quantity' => round($qty, 4),
                    'level' => $level + 1,
                    'componentType' => $line->component_type?->value ?? $line->component_type,
                ];
            }
        }
    }
}
