<?php

namespace App\Interfaces\Http\Support;

use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductBom;
use App\Domain\Factory\Models\ProductDocument;
use App\Domain\Factory\Models\ProductImage;
use App\Domain\Factory\Models\ProductMachineSetting;
use App\Domain\Factory\Models\ProductMold;
use App\Domain\Factory\Models\ProductQualitySpec;

use App\Interfaces\Http\Support\SerializesProductOperations;

trait SerializesProducts
{
    use SerializesProductOperations;
    private function serializeProduct(Product $product, bool $detail = false): array
    {
        $primaryImage = $product->relationLoaded('images')
            ? $product->images->firstWhere('is_primary', true) ?? $product->images->first()
            : null;

        $payload = [
            'id' => (string) $product->id,
            'productCode' => $product->product_code ?? $product->code,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'productNameAr' => $product->product_name_ar ?? $product->name,
            'productNameEn' => $product->product_name_en,
            'shortName' => $product->short_name,
            'categoryId' => $product->category_id ? (string) $product->category_id : null,
            'categoryName' => $product->category?->category_name_ar,
            'productType' => $product->product_type?->value ?? $product->product_type,
            'assemblyType' => $product->assembly_type?->value ?? $product->assembly_type ?? 'single',
            'manufacturingMode' => $product->manufacturing_mode?->value ?? $product->manufacturing_mode ?? 'manufactured',
            'manufacturingType' => $product->manufacturing_type?->value ?? $product->manufacturing_type,
            'plasticMaterialId' => $product->plastic_material_id ? (string) $product->plastic_material_id : null,
            'plasticMaterialName' => $product->plasticMaterial?->material_name,
            'colorId' => $product->color_id ? (string) $product->color_id : null,
            'colorName' => $product->color?->color_name,
            'unitId' => $product->unit_id ? (string) $product->unit_id : null,
            'unitName' => $product->measureUnit?->unit_name_ar ?? $product->unit,
            'productWeight' => $product->product_weight,
            'productVolume' => $product->product_volume,
            'dimensions' => $product->dimensions,
            'cavityOutput' => $product->cavity_output,
            'standardCycleTime' => $product->standard_cycle_time,
            'targetOutputPerHour' => $product->target_output_per_hour,
            'productStatus' => $product->product_status?->value ?? $product->product_status,
            'imageUrl' => $product->image_url ?? $primaryImage?->image_url,
            'technicalNotes' => $product->technical_notes,
            'isActive' => (bool) $product->is_active,
            'standardWeightGrams' => $product->standard_weight_grams,
            'standardCost' => $product->standard_cost,
            // Legacy picker fields for mold forms
            'code' => $product->product_code ?? $product->code,
            'name' => $product->product_name_ar ?? $product->name,
            'unit' => $product->measureUnit?->unit_code ?? $product->unit,
            'createdAt' => $product->created_at?->toIso8601String(),
            'updatedAt' => $product->updated_at?->toIso8601String(),
        ];

        if (! $detail) {
            return $payload;
        }

        $operations = $product->relationLoaded('operations') ? $product->operations : collect();
        $assignedMachines = $this->deriveAssignedMachines($operations);
        $assignedMolds = $this->deriveAssignedMolds($operations);

        return array_merge($payload, [
            'qualitySpec' => $product->qualitySpec ? $this->serializeQualitySpec($product->qualitySpec) : null,
            'bom' => $product->relationLoaded('bomLines')
                ? $product->bomLines->map(fn (ProductBom $b) => $this->serializeBomLine($b))->values()->all()
                : [],
            'molds' => $product->relationLoaded('productMolds')
                ? $product->productMolds->map(fn (ProductMold $pm) => $this->serializeProductMold($pm))->values()->all()
                : [],
            'machineSettings' => $product->relationLoaded('machineSettings')
                ? $product->machineSettings->map(fn (ProductMachineSetting $s) => $this->serializeMachineSetting($s))->values()->all()
                : [],
            'operations' => $operations->isNotEmpty()
                ? $operations->map(fn ($op) => $this->serializeProductOperation($op))->values()->all()
                : [],
            'assignedMachines' => $assignedMachines,
            'assignedMolds' => $assignedMolds,
            'images' => $product->relationLoaded('images')
                ? $product->images->map(fn (ProductImage $i) => $this->serializeImage($i))->values()->all()
                : [],
            'documents' => $product->relationLoaded('documents')
                ? $product->documents->map(fn (ProductDocument $d) => $this->serializeDocument($d))->values()->all()
                : [],
        ]);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, \App\Domain\Factory\Models\ProductOperation>  $operations
     * @return list<array<string, mixed>>
     */
    private function deriveAssignedMachines($operations): array
    {
        return $operations
            ->filter(fn ($op) => $op->machine_id !== null)
            ->unique('machine_id')
            ->map(fn ($op) => [
                'machineId' => (string) $op->machine_id,
                'machineCode' => $op->machine?->code,
                'machineName' => $op->machine?->name,
                'operationIds' => $operations->where('machine_id', $op->machine_id)->pluck('id')->map(fn ($id) => (string) $id)->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, \App\Domain\Factory\Models\ProductOperation>  $operations
     * @return list<array<string, mixed>>
     */
    private function deriveAssignedMolds($operations): array
    {
        return $operations
            ->filter(fn ($op) => $op->mold_id !== null)
            ->unique('mold_id')
            ->map(fn ($op) => [
                'moldId' => (string) $op->mold_id,
                'moldCode' => $op->mold?->code,
                'moldName' => $op->mold?->name,
                'operationIds' => $operations->where('mold_id', $op->mold_id)->pluck('id')->map(fn ($id) => (string) $id)->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeQualitySpec(ProductQualitySpec $spec): array
    {
        return [
            'weightTolerance' => $spec->weight_tolerance,
            'thicknessTolerance' => $spec->thickness_tolerance,
            'colorTolerance' => $spec->color_tolerance,
            'pressureTestRequired' => (bool) $spec->pressure_test_required,
            'leakTestRequired' => (bool) $spec->leak_test_required,
            'dropTestRequired' => (bool) $spec->drop_test_required,
            'visualInspectionRequired' => (bool) $spec->visual_inspection_required,
            'qcNotes' => $spec->qc_notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeBomLine(ProductBom $line): array
    {
        $child = $line->childProduct ?? $line->materialProduct;
        $childId = $line->child_product_id ?? $line->getAttributes()['material_product_id'] ?? null;

        return [
            'id' => (string) $line->id,
            'parentProductId' => (string) $line->product_id,
            'childProductId' => (string) $childId,
            'materialProductId' => (string) $childId,
            'childProductCode' => $child?->product_code ?? $child?->code,
            'childProductName' => $child?->product_name_ar ?? $child?->name,
            'materialProductCode' => $child?->product_code ?? $child?->code,
            'materialProductName' => $child?->product_name_ar ?? $child?->name,
            'quantity' => $line->quantity,
            'unitId' => $line->unit_id ? (string) $line->unit_id : null,
            'unitName' => $line->unit?->unit_name_ar,
            'componentType' => $line->component_type?->value ?? $line->component_type ?? 'component',
            'wastePercentage' => $line->waste_percentage,
            'isOptional' => (bool) $line->is_optional,
            'sequenceOrder' => $line->sequence_order ?? 1,
            'notes' => $line->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeProductMold(ProductMold $pm): array
    {
        return [
            'id' => (string) $pm->id,
            'moldId' => (string) $pm->mold_id,
            'moldCode' => $pm->mold?->code,
            'moldName' => $pm->mold?->name,
            'priority' => $pm->priority,
            'isDefault' => (bool) $pm->is_default,
            'notes' => $pm->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeMachineSetting(ProductMachineSetting $s): array
    {
        return [
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
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeImage(ProductImage $image): array
    {
        return [
            'id' => (string) $image->id,
            'imageUrl' => $image->image_url,
            'imageType' => $image->image_type?->value ?? $image->image_type,
            'isPrimary' => (bool) $image->is_primary,
            'uploadedAt' => $image->uploaded_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeDocument(ProductDocument $doc): array
    {
        return [
            'id' => (string) $doc->id,
            'documentName' => $doc->document_name,
            'documentType' => $doc->document_type?->value ?? $doc->document_type,
            'fileUrl' => $doc->file_url,
            'uploadedAt' => $doc->uploaded_at?->toIso8601String(),
        ];
    }
}
