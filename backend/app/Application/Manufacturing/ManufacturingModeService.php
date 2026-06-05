<?php

namespace App\Application\Manufacturing;

use App\Domain\Factory\Enums\ManufacturingMode;
use App\Domain\Factory\Enums\OperationType;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductBom;
use App\Domain\Factory\Models\ProductMachineSetting;
use App\Domain\Factory\Models\ProductMold;
use App\Domain\Factory\Models\ProductOperation;

/**
 * Derives manufacturing_mode from BOM + routing operations (SAP/Odoo-style).
 *
 * A product may simultaneously have a BOM and manufacturing operations (hybrid).
 */
class ManufacturingModeService
{
    /** @var list<OperationType> */
    private const PRODUCTION_TYPES = [
        OperationType::Injection,
        OperationType::Blow,
        OperationType::Compression,
        OperationType::Cooling,
        OperationType::Trimming,
        OperationType::Printing,
    ];

    /** @var list<OperationType> */
    private const ASSEMBLY_TYPES = [
        OperationType::Assembly,
        OperationType::Packaging,
        OperationType::Labeling,
    ];

    public function resolve(Product $product): ManufacturingMode
    {
        $hasBom = ProductBom::query()->where('product_id', $product->id)->exists();

        $operations = ProductOperation::query()
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->get();

        $hasProductionOps = $operations->contains(
            fn (ProductOperation $op) => in_array($op->operation_type, self::PRODUCTION_TYPES, true)
        );

        $hasAssemblyOps = $operations->contains(
            fn (ProductOperation $op) => in_array($op->operation_type, self::ASSEMBLY_TYPES, true)
        );

        $hasLegacyManufacturing = ProductMold::query()->where('product_id', $product->id)->exists()
            || ProductMachineSetting::query()->where('product_id', $product->id)->exists()
            || ! empty($product->manufacturing_type);

        $hasManufacturing = $hasProductionOps || $hasLegacyManufacturing;

        $productType = $product->product_type?->value ?? (string) $product->product_type;

        if ($productType === 'raw_material' && ! $hasBom && ! $hasManufacturing && ! $hasAssemblyOps) {
            return ManufacturingMode::Purchased;
        }

        if ($hasManufacturing && ($hasBom || $hasAssemblyOps)) {
            return ManufacturingMode::Hybrid;
        }

        if (($hasBom || $hasAssemblyOps) && ! $hasManufacturing) {
            return ManufacturingMode::Assembled;
        }

        if ($hasManufacturing) {
            return ManufacturingMode::Manufactured;
        }

        return $productType === 'raw_material'
            ? ManufacturingMode::Purchased
            : ManufacturingMode::Manufactured;
    }

    public function sync(int $productId): ManufacturingMode
    {
        $product = Product::query()->findOrFail($productId);
        $mode = $this->resolve($product);

        if ($product->manufacturing_mode !== $mode) {
            $product->forceFill(['manufacturing_mode' => $mode])->save();
        }

        return $mode;
    }
}
