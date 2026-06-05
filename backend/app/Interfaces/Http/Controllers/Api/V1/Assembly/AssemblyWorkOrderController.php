<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Assembly;

use App\Application\Assembly\AssemblyOperationService;
use App\Application\Assembly\AssemblyWorkOrderService;
use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Enums\AssemblyWorkOrderStatus;
use App\Domain\Factory\Models\AssemblyWorkOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class AssemblyWorkOrderController
{
    public function __construct(
        private readonly AssemblyWorkOrderService $orders,
        private readonly AssemblyOperationService $operations,
        private readonly MasterQuery $masterQuery,
    ) {}

    public function dashboard(): JsonResponse
    {
        return response()->json(['data' => $this->orders->dashboardStats()]);
    }

    public function index(Request $request): JsonResponse
    {
        $meta = $this->masterQuery->paginateMeta($request, 0);
        $paginator = $this->orders->paginate($meta['page'], $meta['pageSize'], $request->query('status'));
        $meta['total'] = $paginator->total();
        $meta['totalPages'] = $paginator->lastPage();

        return response()->json([
            'data' => collect($paginator->items())->map(fn (AssemblyWorkOrder $wo) => $this->serializeOrder($wo))->values(),
            'meta' => $meta,
        ]);
    }

    public function show(AssemblyWorkOrder $assemblyWorkOrder): JsonResponse
    {
        $wo = $this->orders->findDetail($assemblyWorkOrder->id);

        return response()->json(['data' => $this->serializeOrder($wo, true)]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'workOrderCode' => ['nullable', 'string', 'max:64', 'unique:assembly_work_orders,work_order_code'],
                'finalProductId' => ['required', 'integer', 'exists:products,id'],
                'plannedQuantity' => ['required', 'integer', 'min:1'],
                'status' => ['nullable', Rule::enum(AssemblyWorkOrderStatus::class)],
                'plannedStartDate' => ['nullable', 'date'],
                'plannedEndDate' => ['nullable', 'date'],
                'notes' => ['nullable', 'string'],
            ]);
            $wo = $this->orders->create($data);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeOrder($wo->load('finalProduct'))], 201);
    }

    public function availability(AssemblyWorkOrder $assemblyWorkOrder): JsonResponse
    {
        return response()->json(['data' => $this->orders->materialAvailability($assemblyWorkOrder->id)]);
    }

    public function storeOperation(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'assemblyWorkOrderId' => ['required', 'integer', 'exists:assembly_work_orders,id'],
                'quantityProduced' => ['required', 'integer', 'min:1'],
                'quantityRejected' => ['nullable', 'integer', 'min:0'],
                'operatorId' => ['nullable', 'integer', 'exists:employees,id'],
                'machineId' => ['nullable', 'integer', 'exists:machines,id'],
                'assemblyStartTime' => ['nullable', 'date'],
                'assemblyEndTime' => ['nullable', 'date'],
                'notes' => ['nullable', 'string'],
            ]);
            $op = $this->operations->record($data);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'data' => [
                'id' => (string) $op->id,
                'quantityProduced' => $op->quantity_produced,
                'quantityRejected' => $op->quantity_rejected,
            ],
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeOrder(AssemblyWorkOrder $wo, bool $detail = false): array
    {
        $payload = [
            'id' => (string) $wo->id,
            'workOrderCode' => $wo->work_order_code,
            'finalProductId' => (string) $wo->final_product_id,
            'finalProductCode' => $wo->finalProduct?->product_code ?? $wo->finalProduct?->code,
            'finalProductName' => $wo->finalProduct?->product_name_ar ?? $wo->finalProduct?->name,
            'plannedQuantity' => $wo->planned_quantity,
            'completedQuantity' => $wo->completed_quantity,
            'status' => $wo->status?->value ?? $wo->status,
            'plannedStartDate' => $wo->planned_start_date?->format('Y-m-d'),
            'plannedEndDate' => $wo->planned_end_date?->format('Y-m-d'),
            'actualStartDate' => $wo->actual_start_date?->toIso8601String(),
            'actualEndDate' => $wo->actual_end_date?->toIso8601String(),
            'notes' => $wo->notes,
            'progressPercent' => $wo->planned_quantity > 0
                ? round(($wo->completed_quantity / $wo->planned_quantity) * 100, 1)
                : 0,
        ];

        if (! $detail) {
            return $payload;
        }

        return array_merge($payload, [
            'operations' => $wo->relationLoaded('operations')
                ? $wo->operations->map(fn ($op) => [
                    'id' => (string) $op->id,
                    'quantityProduced' => $op->quantity_produced,
                    'quantityRejected' => $op->quantity_rejected,
                    'productionDuration' => $op->production_duration,
                ])->values()->all()
                : [],
        ]);
    }
}
