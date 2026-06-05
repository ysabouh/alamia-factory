<?php

namespace App\Application\Manufacturing;

use App\Application\Molds\MoldMachineCompatibility;
use App\Domain\Factory\Enums\OperationType;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\ProductOperation;
use InvalidArgumentException;

class OperationValidationService
{
    public function __construct(
        private readonly MoldMachineCompatibility $moldMachineCompatibility,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function assertValidOperation(array $data, ?ProductOperation $existing = null): void
    {
        $operationType = OperationType::tryFrom((string) ($data['operationType'] ?? $data['operation_type'] ?? ''));
        if ($operationType === null) {
            throw new InvalidArgumentException('Invalid operation type.');
        }

        $machineId = $data['machineId'] ?? $data['machine_id'] ?? null;
        $moldId = $data['moldId'] ?? $data['mold_id'] ?? null;

        if ($operationType->requiresMachine() && empty($machineId)) {
            throw new InvalidArgumentException("Operation type [{$operationType->value}] requires a machine.");
        }

        if ($operationType->requiresMold() && empty($moldId)) {
            throw new InvalidArgumentException("Operation type [{$operationType->value}] requires a mold.");
        }

        if (! empty($machineId)) {
            $machine = Machine::query()->with('type')->find((int) $machineId);
            if ($machine === null) {
                throw new InvalidArgumentException('Machine not found.');
            }
            $this->assertMachineOperationCompatibility($operationType, $machine);
        }

        if (! empty($moldId)) {
            $mold = Mold::query()->find((int) $moldId);
            if ($mold === null) {
                throw new InvalidArgumentException('Mold not found.');
            }
            $this->assertMoldOperationCompatibility($operationType, $mold);

            if (! empty($machineId)) {
                $machine = Machine::query()->with('type')->find((int) $machineId);
                $this->moldMachineCompatibility->assertCompatible(
                    $mold->mold_type?->value ?? (string) $mold->mold_type,
                    $machine
                );
            }
        }

        if (! $operationType->requiresMold() && ! empty($moldId)) {
            throw new InvalidArgumentException("Operation type [{$operationType->value}] cannot have a mold assigned.");
        }

        if (! $operationType->requiresMachine() && ! empty($machineId)) {
            $allowed = $operationType->allowedMachineTypeCodes();
            if ($allowed === []) {
                throw new InvalidArgumentException("Operation type [{$operationType->value}] cannot have a machine assigned.");
            }
        }
    }

    /**
     * @param  list<array<string, mixed>>  $operations
     */
    public function assertValidSequence(int $productId, array $operations, ?int $excludeOperationId = null): void
    {
        $sequences = [];
        foreach ($operations as $op) {
            $seq = (int) ($op['sequenceOrder'] ?? $op['sequence_order'] ?? 0);
            if ($seq <= 0) {
                throw new InvalidArgumentException('Operation sequence order must be at least 1.');
            }
            if (isset($sequences[$seq])) {
                throw new InvalidArgumentException("Duplicate sequence order [{$seq}] for product routing.");
            }
            $sequences[$seq] = true;
        }

        $query = ProductOperation::query()
            ->where('product_id', $productId)
            ->where('is_active', true);

        if ($excludeOperationId !== null) {
            $query->where('id', '!=', $excludeOperationId);
        }

        $existing = $query->pluck('sequence_order')->all();
        foreach ($existing as $seq) {
            if (isset($sequences[(int) $seq])) {
                throw new InvalidArgumentException("Sequence order [{$seq}] already exists for this product.");
            }
        }
    }

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

    public function assertLogicalRoutingOrder(
        int $productId,
        ?int $excludeOperationId,
        int $sequenceOrder,
        string $operationTypeValue
    ): void {
        if ($sequenceOrder <= 0) {
            return;
        }

        $newType = OperationType::tryFrom($operationTypeValue);
        if ($newType === null) {
            return;
        }

        $query = ProductOperation::query()
            ->where('product_id', $productId)
            ->where('is_active', true);

        if ($excludeOperationId !== null) {
            $query->where('id', '!=', $excludeOperationId);
        }

        $operations = $query->get();

        if (in_array($newType, self::ASSEMBLY_TYPES, true)) {
            $maxProductionSeq = $operations
                ->filter(fn (ProductOperation $op) => in_array($op->operation_type, self::PRODUCTION_TYPES, true))
                ->max('sequence_order');

            if ($maxProductionSeq !== null && $sequenceOrder <= (int) $maxProductionSeq) {
                throw new InvalidArgumentException(
                    'Assembly and packaging operations must follow manufacturing operations in the routing sequence.'
                );
            }
        }

        if (in_array($newType, self::PRODUCTION_TYPES, true)) {
            $minAssemblySeq = $operations
                ->filter(fn (ProductOperation $op) => in_array($op->operation_type, self::ASSEMBLY_TYPES, true))
                ->min('sequence_order');

            if ($minAssemblySeq !== null && $sequenceOrder >= (int) $minAssemblySeq) {
                throw new InvalidArgumentException(
                    'Manufacturing operations must precede assembly and packaging operations in the routing sequence.'
                );
            }
        }
    }

    private function assertMachineOperationCompatibility(OperationType $operationType, Machine $machine): void
    {
        $allowed = $operationType->allowedMachineTypeCodes();
        if ($allowed === []) {
            return;
        }

        $machine->loadMissing('type');
        $typeCode = $machine->type?->code;
        if ($typeCode === null || ! in_array($typeCode, $allowed, true)) {
            throw new InvalidArgumentException(
                "Machine type [{$typeCode}] is not compatible with operation type [{$operationType->value}]."
            );
        }
    }

    private function assertMoldOperationCompatibility(OperationType $operationType, Mold $mold): void
    {
        $expectedMoldType = $operationType->defaultMoldType();
        if ($expectedMoldType === null) {
            return;
        }

        $moldType = $mold->mold_type?->value ?? (string) $mold->mold_type;
        if ($moldType !== $expectedMoldType) {
            throw new InvalidArgumentException(
                "Mold type [{$moldType}] is not compatible with operation type [{$operationType->value}]."
            );
        }
    }
}
