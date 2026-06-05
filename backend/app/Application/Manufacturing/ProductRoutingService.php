<?php



namespace App\Application\Manufacturing;



use App\Domain\Factory\Enums\OperationType;

use App\Domain\Factory\Models\Product;

use App\Domain\Factory\Models\ProductOperation;



class ProductRoutingService

{

    public function __construct(

        private readonly ProductOperationService $operations,

    ) {}



    /** @var list<OperationType> */

    private const PACKAGING_TYPES = [

        OperationType::Packaging,

        OperationType::Labeling,

    ];



    /**

     * @return array<string, mixed>

     */

    public function routing(int $productId): array

    {

        $product = Product::query()

            ->with(['bomLines.childProduct'])

            ->findOrFail($productId);



        $operations = $this->operations->listForProduct($productId);



        $steps = $operations->map(fn (ProductOperation $op) => [

            'id' => (string) $op->id,

            'sequenceOrder' => $op->sequence_order,

            'operationCode' => $op->operation_code,

            'operationName' => $op->operation_name,

            'operationType' => $op->operation_type?->value ?? $op->operation_type,

            'machineId' => $op->machine_id ? (string) $op->machine_id : null,

            'machineCode' => $op->machine?->code,

            'machineName' => $op->machine?->name,

            'moldId' => $op->mold_id ? (string) $op->mold_id : null,

            'moldCode' => $op->mold?->code,

            'moldName' => $op->mold?->name,

            'workCenterId' => $op->work_center_id ? (string) $op->work_center_id : null,

            'workCenterName' => $op->workCenter?->work_center_name,

            'setupTime' => $op->setup_time,

            'cycleTime' => $op->cycle_time,

            'laborTime' => $op->labor_time,

            'coolingTime' => $op->cooling_time,

            'qcRequired' => (bool) $op->qc_required,

            'isActive' => (bool) $op->is_active,

        ])->values()->all();



        $bomMaterials = $product->bomLines->map(fn ($line) => [

            'productId' => (string) ($line->child_product_id ?? $line->material_product_id),

            'productCode' => $line->childProduct?->product_code ?? $line->childProduct?->code,

            'productName' => $line->childProduct?->product_name_ar ?? $line->childProduct?->name,

            'componentType' => $line->component_type?->value ?? $line->component_type,

            'quantity' => $line->quantity,

        ])->values()->all();



        $flow = [];

        if ($bomMaterials !== []) {

            $flow[] = ['kind' => 'materials', 'label' => 'Raw Materials / Components', 'items' => $bomMaterials];

        }



        foreach ($steps as $step) {

            $flow[] = [

                'kind' => 'operation',

                'label' => $step['operationName'],

                'operationType' => $step['operationType'],

                'operationId' => $step['id'],

            ];

        }



        $machines = $operations

            ->filter(fn (ProductOperation $op) => $op->machine_id !== null)

            ->unique('machine_id')

            ->map(fn (ProductOperation $op) => [

                'machineId' => (string) $op->machine_id,

                'machineCode' => $op->machine?->code,

                'machineName' => $op->machine?->name,

                'operationIds' => $operations->where('machine_id', $op->machine_id)->pluck('id')->map(fn ($id) => (string) $id)->values()->all(),

            ])

            ->values()

            ->all();



        $molds = $operations

            ->filter(fn (ProductOperation $op) => $op->mold_id !== null)

            ->unique('mold_id')

            ->map(fn (ProductOperation $op) => [

                'moldId' => (string) $op->mold_id,

                'moldCode' => $op->mold?->code,

                'moldName' => $op->mold?->name,

                'operationIds' => $operations->where('mold_id', $op->mold_id)->pluck('id')->map(fn ($id) => (string) $id)->values()->all(),

            ])

            ->values()

            ->all();



        $machineParameters = [];

        foreach ($operations as $op) {

            foreach ($op->machineSettings as $setting) {

                $machineParameters[] = [

                    'operationId' => (string) $op->id,

                    'operationName' => $op->operation_name,

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

                    'setupNotes' => $setting->setup_notes,

                ];

            }

        }



        $qcSpecifications = [];

        foreach ($operations as $op) {

            foreach ($op->qualitySpecs as $spec) {

                $qcSpecifications[] = [

                    'operationId' => (string) $op->id,

                    'operationName' => $op->operation_name,

                    'inspectionType' => $spec->inspection_type,

                    'toleranceMin' => $spec->tolerance_min,

                    'toleranceMax' => $spec->tolerance_max,

                    'inspectionFrequency' => $spec->inspection_frequency,

                    'qcNotes' => $spec->qc_notes,

                ];

            }

        }



        $packagingOperations = $operations

            ->filter(fn (ProductOperation $op) => in_array($op->operation_type, self::PACKAGING_TYPES, true))

            ->map(fn (ProductOperation $op) => [

                'id' => (string) $op->id,

                'operationCode' => $op->operation_code,

                'operationName' => $op->operation_name,

                'operationType' => $op->operation_type?->value ?? $op->operation_type,

                'sequenceOrder' => $op->sequence_order,

            ])

            ->values()

            ->all();



        return [

            'productId' => (string) $product->id,

            'manufacturingMode' => $product->manufacturing_mode?->value ?? $product->manufacturing_mode ?? 'manufactured',

            'operations' => $steps,

            'flow' => $flow,

            'assignedMachines' => $machines,

            'assignedMolds' => $molds,

            'machineParameters' => $machineParameters,

            'qcSpecifications' => $qcSpecifications,

            'packagingOperations' => $packagingOperations,

            'bomComponentCount' => count($bomMaterials),

            'operationCount' => count($steps),

        ];

    }

}

