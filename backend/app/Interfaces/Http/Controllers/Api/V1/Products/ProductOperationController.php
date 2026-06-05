<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Products;

use App\Application\Manufacturing\ProductOperationService;
use App\Application\Manufacturing\ProductRoutingService;
use App\Domain\Factory\Enums\OperationType;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductOperation;
use App\Interfaces\Http\Support\SerializesProductOperations;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class ProductOperationController
{
    use SerializesProductOperations;

    public function __construct(
        private readonly ProductOperationService $operations,
        private readonly ProductRoutingService $routing,
    ) {}

    public function index(Product $product): JsonResponse
    {
        $items = $this->operations->listForProduct($product->id);

        return response()->json([
            'data' => $items->map(fn (ProductOperation $op) => $this->serializeProductOperation($op))->values(),
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        try {
            $operation = $this->operations->create($product->id, $this->validated($request));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeProductOperation($operation)], 201);
    }

    public function update(Request $request, ProductOperation $productOperation): JsonResponse
    {
        try {
            $operation = $this->operations->update($productOperation, $this->validated($request, false));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeProductOperation($operation)]);
    }

    public function destroy(ProductOperation $productOperation): JsonResponse
    {
        $this->operations->delete($productOperation);

        return response()->json(null, 204);
    }

    public function routing(Product $product): JsonResponse
    {
        return response()->json(['data' => $this->routing->routing($product->id)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'operationCode' => [$creating ? 'required' : 'sometimes', 'string', 'max:64'],
            'operationName' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'operationType' => [$creating ? 'required' : 'sometimes', Rule::enum(OperationType::class)],
            'sequenceOrder' => ['nullable', 'integer', 'min:1'],
            'machineId' => ['nullable', 'integer', 'exists:machines,id'],
            'moldId' => ['nullable', 'integer', 'exists:molds,id'],
            'workCenterId' => ['nullable', 'integer', 'exists:work_centers,id'],
            'setupTime' => ['nullable', 'integer', 'min:0'],
            'cycleTime' => ['nullable', 'integer', 'min:0'],
            'laborTime' => ['nullable', 'integer', 'min:0'],
            'coolingTime' => ['nullable', 'integer', 'min:0'],
            'operationInstructions' => ['nullable', 'string'],
            'qcRequired' => ['nullable', 'boolean'],
            'isActive' => ['nullable', 'boolean'],
            'machineSettings' => ['nullable', 'array'],
            'machineSettings.*.machineId' => ['required_with:machineSettings', 'integer', 'exists:machines,id'],
            'machineSettings.*.injectionPressure' => ['nullable', 'numeric'],
            'machineSettings.*.holdingPressure' => ['nullable', 'numeric'],
            'machineSettings.*.coolingTime' => ['nullable', 'integer'],
            'machineSettings.*.moldTemperature' => ['nullable', 'numeric'],
            'machineSettings.*.barrelTemperatureProfile' => ['nullable', 'array'],
            'machineSettings.*.clampForce' => ['nullable', 'numeric'],
            'machineSettings.*.shotWeight' => ['nullable', 'numeric'],
            'machineSettings.*.screwSpeed' => ['nullable', 'integer'],
            'machineSettings.*.backPressure' => ['nullable', 'numeric'],
            'machineSettings.*.setupNotes' => ['nullable', 'string'],
            'materialConsumptions' => ['nullable', 'array'],
            'materialConsumptions.*.materialProductId' => ['required_with:materialConsumptions', 'integer', 'exists:products,id'],
            'materialConsumptions.*.plannedQuantity' => ['nullable', 'numeric', 'min:0'],
            'materialConsumptions.*.actualQuantity' => ['nullable', 'numeric', 'min:0'],
            'materialConsumptions.*.wasteQuantity' => ['nullable', 'numeric', 'min:0'],
            'qualitySpecs' => ['nullable', 'array'],
            'qualitySpecs.*.inspectionType' => ['required_with:qualitySpecs', 'string', 'max:64'],
            'qualitySpecs.*.toleranceMin' => ['nullable', 'numeric'],
            'qualitySpecs.*.toleranceMax' => ['nullable', 'numeric'],
            'qualitySpecs.*.inspectionFrequency' => ['nullable', 'string', 'max:64'],
            'qualitySpecs.*.qcNotes' => ['nullable', 'string'],
        ]);
    }
}
