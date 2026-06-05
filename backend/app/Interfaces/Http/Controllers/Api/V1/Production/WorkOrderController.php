<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Production;

use App\Application\Production\ProductionDashboardService;
use App\Application\Production\ProductionLogService;
use App\Application\Production\WorkOrderService;
use App\Domain\Factory\Enums\WorkOrderStatus;
use App\Domain\Factory\Enums\WorkOrderWorkerRole;
use App\Domain\Factory\Models\WorkOrder;
use App\Domain\Factory\Models\WorkOrderWorker;
use App\Interfaces\Http\Support\SerializesWorkOrders;
use App\Application\Workforce\Masters\MasterQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class WorkOrderController
{
    use SerializesWorkOrders;

    public function __construct(
        private readonly WorkOrderService $orders,
        private readonly ProductionLogService $logs,
        private readonly ProductionDashboardService $dashboard,
        private readonly MasterQuery $masterQuery,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $meta = $this->masterQuery->paginateMeta($request, 0);
        $paginator = $this->orders->paginate($request->query(), $meta['page'], $meta['pageSize']);
        $meta['total'] = $paginator->total();
        $meta['totalPages'] = $paginator->lastPage();

        return response()->json([
            'data' => collect($paginator->items())->map(fn (WorkOrder $o) => $this->serializeWorkOrder($o))->values(),
            'meta' => $meta,
        ]);
    }

    public function show(WorkOrder $workOrder): JsonResponse
    {
        return response()->json([
            'data' => $this->serializeWorkOrder($this->orders->findDetail($workOrder->id), true),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $data = $this->validatedOrder($request);
            $data['createdByUserId'] = Auth::id();
            $order = $this->orders->create($data);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeWorkOrder($order, true)], 201);
    }

    public function update(Request $request, WorkOrder $workOrder): JsonResponse
    {
        try {
            $order = $this->orders->update($workOrder, $this->validatedOrder($request, false));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeWorkOrder($order, true)]);
    }

    public function start(WorkOrder $workOrder): JsonResponse
    {
        try {
            $order = $this->orders->start($workOrder);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeWorkOrder($order, true)]);
    }

    public function pause(WorkOrder $workOrder): JsonResponse
    {
        try {
            $order = $this->orders->pause($workOrder);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeWorkOrder($order, true)]);
    }

    public function resume(WorkOrder $workOrder): JsonResponse
    {
        try {
            $order = $this->orders->resume($workOrder);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeWorkOrder($order, true)]);
    }

    public function complete(WorkOrder $workOrder): JsonResponse
    {
        try {
            $order = $this->orders->complete($workOrder);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeWorkOrder($order, true)]);
    }

    public function cancel(WorkOrder $workOrder): JsonResponse
    {
        try {
            $order = $this->orders->cancel($workOrder);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeWorkOrder($order, true)]);
    }

    public function workers(WorkOrder $workOrder): JsonResponse
    {
        $order = $this->orders->findDetail($workOrder->id);

        return response()->json([
            'data' => $order->workers->map(fn ($w) => $this->serializeWorker($w))->values(),
        ]);
    }

    public function storeWorker(Request $request, WorkOrder $workOrder): JsonResponse
    {
        $data = $request->validate([
            'employeeId' => ['required', 'integer', 'exists:employees,id'],
            'role' => ['nullable', Rule::enum(WorkOrderWorkerRole::class)],
            'effectiveFrom' => ['nullable', 'date'],
        ]);

        try {
            $worker = $this->orders->addWorker($workOrder, $data, Auth::id());
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeWorker($worker)], 201);
    }

    public function removeWorker(WorkOrder $workOrder, WorkOrderWorker $workOrderWorker): JsonResponse
    {
        if ((int) $workOrderWorker->work_order_id !== (int) $workOrder->id) {
            return response()->json(['message' => 'العامل غير مرتبط بهذا الأمر.'], 404);
        }

        $this->orders->removeWorker($workOrderWorker, Auth::id());

        return response()->json(null, 204);
    }

    public function workersHistory(WorkOrder $workOrder): JsonResponse
    {
        $items = $this->orders->listWorkersHistory($workOrder->id);

        return response()->json([
            'data' => $items->map(fn ($w) => $this->serializeWorker($w))->values(),
        ]);
    }

    public function logs(WorkOrder $workOrder): JsonResponse
    {
        $items = $this->logs->listForOrder($workOrder->id);

        return response()->json([
            'data' => $items->map(fn ($l) => $this->serializeLog($l))->values(),
        ]);
    }

    public function storeLog(Request $request, WorkOrder $workOrder): JsonResponse
    {
        try {
            $data = $request->validate([
                'fromTime' => ['required', 'date'],
                'toTime' => ['required', 'date', 'after:fromTime'],
                'goodQuantity' => ['required', 'integer', 'min:0'],
                'scrapQuantity' => ['nullable', 'integer', 'min:0'],
                'notes' => ['nullable', 'string'],
            ]);
            $log = $this->logs->create($workOrder->id, $data, Auth::id());
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeLog($log)], 201);
    }

    public function dashboardKpis(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->dashboard->kpis($request->query()),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedOrder(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'orderNo' => [$creating ? 'nullable' : 'sometimes', 'string', 'max:64', 'unique:work_orders,order_no'],
            'productId' => [$creating ? 'required' : 'sometimes', 'integer', 'exists:products,id'],
            'productionDate' => ['nullable', 'date'],
            'machineId' => ['nullable', 'integer', 'exists:machines,id'],
            'moldId' => ['nullable', 'integer', 'exists:molds,id'],
            'shiftId' => ['nullable', 'integer', 'exists:shifts,id'],
            'supervisorId' => ['nullable', 'integer', 'exists:employees,id'],
            'productionManagerId' => ['nullable', 'integer', 'exists:employees,id'],
            'plannedQuantity' => [$creating ? 'required' : 'sometimes', 'integer', 'min:1'],
            'priority' => ['nullable', 'string', 'max:32'],
            'dueDate' => ['nullable', 'date'],
            'productOperationId' => ['nullable', 'integer', 'exists:product_operations,id'],
            'notes' => ['nullable', 'string'],
            'workers' => ['nullable', 'array'],
            'workers.*.employeeId' => ['required_with:workers', 'integer', 'exists:employees,id'],
            'workers.*.role' => ['nullable', Rule::enum(WorkOrderWorkerRole::class)],
        ]);
    }
}
