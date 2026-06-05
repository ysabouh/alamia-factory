<?php

namespace App\Application\Manufacturing;

use App\Domain\Factory\Models\OperationMachineSetting;
use App\Domain\Factory\Models\OperationMaterialConsumption;
use App\Domain\Factory\Models\OperationQualitySpec;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductOperation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ProductOperationService
{
    public function __construct(
        private readonly OperationValidationService $validation,
        private readonly ManufacturingModeService $manufacturingMode,
    ) {}

    /**
     * @return Collection<int, ProductOperation>
     */
    public function listForProduct(int $productId): Collection
    {
        return ProductOperation::query()
            ->where('product_id', $productId)
            ->with([
                'machine.type',
                'mold',
                'workCenter',
                'machineSettings.machine',
                'materialConsumptions.materialProduct',
                'qualitySpecs',
            ])
            ->orderBy('sequence_order')
            ->get();
    }

    public function find(int $id): ProductOperation
    {
        return ProductOperation::query()
            ->with([
                'machine.type',
                'mold',
                'workCenter',
                'machineSettings.machine',
                'materialConsumptions.materialProduct',
                'qualitySpecs',
            ])
            ->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(int $productId, array $data): ProductOperation
    {
        Product::query()->findOrFail($productId);

        return DB::transaction(function () use ($productId, $data): ProductOperation {
            $payload = $this->normalizePayload($data, null, $productId);
            $this->validation->assertValidOperation($payload);
            $this->validation->assertValidSequence($productId, [$payload]);
            $this->validation->assertLogicalRoutingOrder($productId, null, (int) ($payload['sequence_order'] ?? 0), $payload['operation_type'] ?? '');

            $operation = ProductOperation::query()->create(array_merge(
                ['product_id' => $productId],
                $payload
            ));

            $this->syncNested($operation, $data);

            $this->manufacturingMode->sync($productId);

            return $this->find($operation->id);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ProductOperation $operation, array $data): ProductOperation
    {
        return DB::transaction(function () use ($operation, $data): ProductOperation {
            $payload = $this->normalizePayload($data, $operation);
            $merged = array_merge($operation->only(array_keys($payload)), $payload);
            $merged['operationType'] = $payload['operation_type'] ?? $operation->operation_type?->value;
            $merged['machineId'] = $payload['machine_id'] ?? $operation->machine_id;
            $merged['moldId'] = $payload['mold_id'] ?? $operation->mold_id;
            $merged['sequenceOrder'] = $payload['sequence_order'] ?? $operation->sequence_order;

            $this->validation->assertValidOperation($merged, $operation);
            $this->validation->assertValidSequence(
                $operation->product_id,
                [['sequenceOrder' => $merged['sequenceOrder']]],
                $operation->id
            );
            $this->validation->assertLogicalRoutingOrder(
                $operation->product_id,
                $operation->id,
                (int) $merged['sequenceOrder'],
                (string) ($merged['operationType'] ?? '')
            );

            $operation->fill($payload);
            $operation->save();

            $this->syncNested($operation, $data);

            $this->manufacturingMode->sync((int) $operation->product_id);

            return $this->find($operation->id);
        });
    }

    public function delete(ProductOperation $operation): void
    {
        $productId = (int) $operation->product_id;
        $operation->delete();
        $this->manufacturingMode->sync($productId);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizePayload(array $data, ?ProductOperation $existing = null, ?int $productId = null): array
    {
        $map = [
            'operation_code' => 'operationCode',
            'operation_name' => 'operationName',
            'operation_type' => 'operationType',
            'sequence_order' => 'sequenceOrder',
            'machine_id' => 'machineId',
            'mold_id' => 'moldId',
            'work_center_id' => 'workCenterId',
            'setup_time' => 'setupTime',
            'cycle_time' => 'cycleTime',
            'labor_time' => 'laborTime',
            'cooling_time' => 'coolingTime',
            'operation_instructions' => 'operationInstructions',
            'qc_required' => 'qcRequired',
            'is_active' => 'isActive',
        ];

        $payload = [];
        foreach ($map as $db => $json) {
            if (array_key_exists($json, $data)) {
                $val = $data[$json];
                $payload[$db] = $val === '' ? null : $val;
            } elseif ($existing === null && array_key_exists($db, $data)) {
                $payload[$db] = $data[$db];
            }
        }

        if ($existing === null && ! isset($payload['sequence_order'])) {
            $pid = $productId ?? (int) ($data['productId'] ?? 0);
            $max = ProductOperation::query()->where('product_id', $pid)->max('sequence_order');
            $payload['sequence_order'] = ((int) $max) + 10;
        }

        if ($existing === null && empty($payload['operation_code'])) {
            throw new InvalidArgumentException('Operation code is required.');
        }

        if ($existing === null && empty($payload['operation_name'])) {
            throw new InvalidArgumentException('Operation name is required.');
        }

        if ($existing === null && empty($payload['operation_type'])) {
            throw new InvalidArgumentException('Operation type is required.');
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncNested(ProductOperation $operation, array $data): void
    {
        if (array_key_exists('machineSettings', $data)) {
            $this->syncMachineSettings($operation, $data['machineSettings'] ?? []);
        } elseif (array_key_exists('machineSetting', $data) && is_array($data['machineSetting'])) {
            $this->syncMachineSettings($operation, [$data['machineSetting']]);
        }

        if (array_key_exists('materialConsumptions', $data)) {
            $this->syncMaterialConsumptions($operation, $data['materialConsumptions'] ?? []);
        }

        if (array_key_exists('qualitySpecs', $data)) {
            $this->syncQualitySpecs($operation, $data['qualitySpecs'] ?? []);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function syncMachineSettings(ProductOperation $operation, array $items): void
    {
        OperationMachineSetting::query()->where('product_operation_id', $operation->id)->delete();

        foreach ($items as $item) {
            $machineId = (int) ($item['machineId'] ?? $item['machine_id'] ?? $operation->machine_id ?? 0);
            if ($machineId <= 0) {
                continue;
            }

            OperationMachineSetting::query()->create([
                'product_operation_id' => $operation->id,
                'machine_id' => $machineId,
                'injection_pressure' => $item['injectionPressure'] ?? null,
                'holding_pressure' => $item['holdingPressure'] ?? null,
                'cooling_time' => $item['coolingTime'] ?? null,
                'mold_temperature' => $item['moldTemperature'] ?? null,
                'barrel_temperature_profile' => $item['barrelTemperatureProfile'] ?? null,
                'clamp_force' => $item['clampForce'] ?? null,
                'shot_weight' => $item['shotWeight'] ?? null,
                'screw_speed' => $item['screwSpeed'] ?? null,
                'back_pressure' => $item['backPressure'] ?? null,
                'setup_notes' => $item['setupNotes'] ?? null,
            ]);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function syncMaterialConsumptions(ProductOperation $operation, array $items): void
    {
        OperationMaterialConsumption::query()->where('product_operation_id', $operation->id)->delete();

        foreach ($items as $item) {
            $materialId = (int) ($item['materialProductId'] ?? $item['material_product_id'] ?? 0);
            if ($materialId <= 0) {
                continue;
            }

            OperationMaterialConsumption::query()->create([
                'product_operation_id' => $operation->id,
                'material_product_id' => $materialId,
                'planned_quantity' => (float) ($item['plannedQuantity'] ?? 0),
                'actual_quantity' => isset($item['actualQuantity']) ? (float) $item['actualQuantity'] : null,
                'waste_quantity' => isset($item['wasteQuantity']) ? (float) $item['wasteQuantity'] : null,
            ]);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function syncQualitySpecs(ProductOperation $operation, array $items): void
    {
        OperationQualitySpec::query()->where('product_operation_id', $operation->id)->delete();

        foreach ($items as $item) {
            if (empty($item['inspectionType'])) {
                continue;
            }

            OperationQualitySpec::query()->create([
                'product_operation_id' => $operation->id,
                'inspection_type' => $item['inspectionType'],
                'tolerance_min' => $item['toleranceMin'] ?? null,
                'tolerance_max' => $item['toleranceMax'] ?? null,
                'inspection_frequency' => $item['inspectionFrequency'] ?? null,
                'qc_notes' => $item['qcNotes'] ?? null,
            ]);
        }
    }
}
