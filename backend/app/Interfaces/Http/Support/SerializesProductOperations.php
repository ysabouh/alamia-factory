<?php

namespace App\Interfaces\Http\Support;

use App\Domain\Factory\Models\OperationMachineSetting;
use App\Domain\Factory\Models\OperationMaterialConsumption;
use App\Domain\Factory\Models\OperationQualitySpec;
use App\Domain\Factory\Models\ProductOperation;

trait SerializesProductOperations
{
    /**
     * @return array<string, mixed>
     */
    protected function serializeProductOperation(ProductOperation $operation): array
    {
        return [
            'id' => (string) $operation->id,
            'productId' => (string) $operation->product_id,
            'operationCode' => $operation->operation_code,
            'operationName' => $operation->operation_name,
            'operationType' => $operation->operation_type?->value ?? $operation->operation_type,
            'sequenceOrder' => $operation->sequence_order,
            'machineId' => $operation->machine_id ? (string) $operation->machine_id : null,
            'machineCode' => $operation->machine?->code,
            'machineName' => $operation->machine?->name,
            'moldId' => $operation->mold_id ? (string) $operation->mold_id : null,
            'moldCode' => $operation->mold?->code,
            'moldName' => $operation->mold?->name,
            'workCenterId' => $operation->work_center_id ? (string) $operation->work_center_id : null,
            'workCenterName' => $operation->workCenter?->work_center_name,
            'setupTime' => $operation->setup_time,
            'cycleTime' => $operation->cycle_time,
            'laborTime' => $operation->labor_time,
            'coolingTime' => $operation->cooling_time,
            'operationInstructions' => $operation->operation_instructions,
            'qcRequired' => (bool) $operation->qc_required,
            'isActive' => (bool) $operation->is_active,
            'machineSettings' => $operation->relationLoaded('machineSettings')
                ? $operation->machineSettings->map(fn (OperationMachineSetting $s) => $this->serializeOperationMachineSetting($s))->values()->all()
                : [],
            'materialConsumptions' => $operation->relationLoaded('materialConsumptions')
                ? $operation->materialConsumptions->map(fn (OperationMaterialConsumption $m) => $this->serializeOperationMaterialConsumption($m))->values()->all()
                : [],
            'qualitySpecs' => $operation->relationLoaded('qualitySpecs')
                ? $operation->qualitySpecs->map(fn (OperationQualitySpec $q) => $this->serializeOperationQualitySpec($q))->values()->all()
                : [],
            'createdAt' => $operation->created_at?->toIso8601String(),
            'updatedAt' => $operation->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeOperationMachineSetting(OperationMachineSetting $setting): array
    {
        return [
            'id' => (string) $setting->id,
            'machineId' => (string) $setting->machine_id,
            'machineCode' => $setting->machine?->code,
            'machineName' => $setting->machine?->name,
            'injectionPressure' => $setting->injection_pressure,
            'holdingPressure' => $setting->holding_pressure,
            'coolingTime' => $setting->cooling_time,
            'moldTemperature' => $setting->mold_temperature,
            'barrelTemperatureProfile' => $setting->barrel_temperature_profile,
            'clampForce' => $setting->clamp_force,
            'shotWeight' => $setting->shot_weight,
            'screwSpeed' => $setting->screw_speed,
            'backPressure' => $setting->back_pressure,
            'setupNotes' => $setting->setup_notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeOperationMaterialConsumption(OperationMaterialConsumption $row): array
    {
        return [
            'id' => (string) $row->id,
            'materialProductId' => (string) $row->material_product_id,
            'materialProductCode' => $row->materialProduct?->product_code ?? $row->materialProduct?->code,
            'materialProductName' => $row->materialProduct?->product_name_ar ?? $row->materialProduct?->name,
            'plannedQuantity' => $row->planned_quantity,
            'actualQuantity' => $row->actual_quantity,
            'wasteQuantity' => $row->waste_quantity,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeOperationQualitySpec(OperationQualitySpec $spec): array
    {
        return [
            'id' => (string) $spec->id,
            'inspectionType' => $spec->inspection_type,
            'toleranceMin' => $spec->tolerance_min,
            'toleranceMax' => $spec->tolerance_max,
            'inspectionFrequency' => $spec->inspection_frequency,
            'qcNotes' => $spec->qc_notes,
        ];
    }
}
