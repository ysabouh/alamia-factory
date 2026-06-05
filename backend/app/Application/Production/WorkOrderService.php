<?php

namespace App\Application\Production;

use App\Domain\Factory\Enums\WorkOrderStatus;
use App\Domain\Factory\Enums\WorkOrderWorkerRole;
use App\Domain\Factory\Models\QualityInspection;
use App\Domain\Factory\Models\WorkOrder;
use App\Domain\Factory\Models\WorkOrderWorker;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class WorkOrderService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters, int $page, int $pageSize): LengthAwarePaginator
    {
        return $this->filterQuery($filters)
            ->with(['product', 'machine', 'mold', 'shift', 'supervisor', 'productionManager'])
            ->orderByDesc('production_date')
            ->orderByDesc('id')
            ->paginate(perPage: $pageSize, page: $page);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function filterQuery(array $filters): Builder
    {
        $q = WorkOrder::query();

        if (! empty($filters['status'])) {
            $q->where('status', (string) $filters['status']);
        }
        if (! empty($filters['machineId'])) {
            $q->where('machine_id', (int) $filters['machineId']);
        }
        if (! empty($filters['shiftId'])) {
            $q->where('shift_id', (int) $filters['shiftId']);
        }
        if (! empty($filters['productId'])) {
            $q->where('product_id', (int) $filters['productId']);
        }
        if (! empty($filters['from'])) {
            $q->whereDate('production_date', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $q->whereDate('production_date', '<=', $filters['to']);
        }
        if (! empty($filters['search'])) {
            $term = '%'.trim((string) $filters['search']).'%';
            $q->where(function (Builder $b) use ($term): void {
                $b->where('order_no', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('notes', 'like', $term);
            });
        }

        return $q;
    }

    public function findDetail(int $id): WorkOrder
    {
        return WorkOrder::query()
            ->with([
                'product',
                'machine.type',
                'mold',
                'shift',
                'supervisor',
                'productionManager',
                'productOperation',
                'workers.employee',
                'workers.createdBy',
                'workers.removedBy',
                'logs.creator',
                'inspections.results.checklistItem',
                'inspections.qualityEmployee',
                'inspections.photos',
                'inspections.defectLinks.defect',
                'downtimes.reason',
            ])
            ->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): WorkOrder
    {
        return DB::transaction(function () use ($data): WorkOrder {
            $orderNo = (string) ($data['orderNo'] ?? $data['code'] ?? $this->nextOrderNo());
            $plannedQty = (int) ($data['plannedQuantity'] ?? $data['targetQuantity'] ?? 0);

            $order = WorkOrder::query()->create([
                'product_id' => (int) $data['productId'],
                'code' => $orderNo,
                'order_no' => $orderNo,
                'production_date' => $data['productionDate'] ?? now()->toDateString(),
                'machine_id' => ! empty($data['machineId']) ? (int) $data['machineId'] : null,
                'mold_id' => ! empty($data['moldId']) ? (int) $data['moldId'] : null,
                'shift_id' => ! empty($data['shiftId']) ? (int) $data['shiftId'] : null,
                'supervisor_id' => ! empty($data['supervisorId']) ? (int) $data['supervisorId'] : null,
                'production_manager_id' => ! empty($data['productionManagerId']) ? (int) $data['productionManagerId'] : null,
                'target_quantity' => $plannedQty,
                'planned_quantity' => $plannedQty,
                'priority' => $data['priority'] ?? 'normal',
                'status' => WorkOrderStatus::Draft,
                'due_date' => $data['dueDate'] ?? null,
                'product_operation_id' => ! empty($data['productOperationId']) ? (int) $data['productOperationId'] : null,
                'notes' => $data['notes'] ?? null,
            ]);

            if (! empty($data['workers']) && is_array($data['workers'])) {
                $userId = isset($data['createdByUserId']) ? (int) $data['createdByUserId'] : null;
                foreach ($data['workers'] as $row) {
                    $this->addWorker($order, $row, $userId);
                }
            }

            return $this->findDetail($order->id);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(WorkOrder $order, array $data): WorkOrder
    {
        if ($order->status === WorkOrderStatus::Completed) {
            throw new InvalidArgumentException('لا يمكن تعديل أمر إنتاج مكتمل.');
        }

        return DB::transaction(function () use ($order, $data): WorkOrder {
            $map = [
                'product_id' => 'productId',
                'machine_id' => 'machineId',
                'mold_id' => 'moldId',
                'shift_id' => 'shiftId',
                'supervisor_id' => 'supervisorId',
                'production_manager_id' => 'productionManagerId',
                'product_operation_id' => 'productOperationId',
                'production_date' => 'productionDate',
                'due_date' => 'dueDate',
                'priority' => 'priority',
                'notes' => 'notes',
            ];

            foreach ($map as $db => $json) {
                if (array_key_exists($json, $data)) {
                    $val = $data[$json];
                    $order->{$db} = $val === '' || $val === null ? null : $val;
                }
            }

            if (array_key_exists('plannedQuantity', $data)) {
                $qty = (int) $data['plannedQuantity'];
                $order->planned_quantity = $qty;
                $order->target_quantity = $qty;
            }

            $order->save();

            return $this->findDetail($order->id);
        });
    }

    public function start(WorkOrder $order): WorkOrder
    {
        if ($order->status !== WorkOrderStatus::Draft && $order->status !== WorkOrderStatus::Paused) {
            throw new InvalidArgumentException('لا يمكن بدء الأمر في هذه الحالة.');
        }

        $order->update([
            'status' => WorkOrderStatus::Running,
            'start_time' => $order->start_time ?? now(),
        ]);

        return $this->findDetail($order->id);
    }

    public function pause(WorkOrder $order): WorkOrder
    {
        if ($order->status !== WorkOrderStatus::Running) {
            throw new InvalidArgumentException('لا يمكن إيقاف أمر غير قيد التشغيل.');
        }

        $order->update(['status' => WorkOrderStatus::Paused]);

        return $this->findDetail($order->id);
    }

    public function resume(WorkOrder $order): WorkOrder
    {
        return $this->start($order);
    }

    public function complete(WorkOrder $order): WorkOrder
    {
        if ($order->status !== WorkOrderStatus::Running && $order->status !== WorkOrderStatus::Paused) {
            throw new InvalidArgumentException('لا يمكن إغلاق الأمر في هذه الحالة.');
        }

        $hasFinalPass = QualityInspection::query()
            ->where('work_order_id', $order->id)
            ->where('is_final', true)
            ->where('status', 'passed')
            ->exists();

        if (! $hasFinalPass) {
            throw new InvalidArgumentException('لا يمكن إغلاق أمر الإنتاج دون فحص جودة نهائي ناجح.');
        }

        $order->update([
            'status' => WorkOrderStatus::Completed,
            'end_time' => now(),
        ]);

        return $this->findDetail($order->id);
    }

    public function cancel(WorkOrder $order): WorkOrder
    {
        if ($order->status === WorkOrderStatus::Completed) {
            throw new InvalidArgumentException('لا يمكن إلغاء أمر مكتمل.');
        }

        $order->update([
            'status' => WorkOrderStatus::Cancelled,
            'end_time' => now(),
        ]);

        return $this->findDetail($order->id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function addWorker(WorkOrder $order, array $data, ?int $userId): WorkOrderWorker
    {
        $employeeId = (int) ($data['employeeId'] ?? 0);
        if ($employeeId <= 0) {
            throw new InvalidArgumentException('يجب اختيار العامل.');
        }

        $active = WorkOrderWorker::query()
            ->where('work_order_id', $order->id)
            ->where('employee_id', $employeeId)
            ->first();
        if ($active) {
            throw new InvalidArgumentException('هذا العامل مسجّل بالفعل على الأمر.');
        }

        $effectiveFrom = ! empty($data['effectiveFrom']) ? $data['effectiveFrom'] : now();

        $trashed = WorkOrderWorker::query()
            ->onlyTrashed()
            ->where('work_order_id', $order->id)
            ->where('employee_id', $employeeId)
            ->first();

        if ($trashed) {
            $trashed->restore();
            $trashed->update([
                'role' => $data['role'] ?? WorkOrderWorkerRole::Operator->value,
                'effective_from' => $effectiveFrom,
                'created_by' => $userId,
                'removed_by' => null,
            ]);

            return $trashed->fresh(['employee', 'createdBy', 'removedBy']);
        }

        return WorkOrderWorker::query()->create([
            'work_order_id' => $order->id,
            'employee_id' => $employeeId,
            'role' => $data['role'] ?? WorkOrderWorkerRole::Operator->value,
            'effective_from' => $effectiveFrom,
            'created_by' => $userId,
        ]);
    }

    public function removeWorker(WorkOrderWorker $worker, ?int $userId): void
    {
        $worker->update(['removed_by' => $userId]);
        $worker->delete();
    }

    /**
     * @return Collection<int, WorkOrderWorker>
     */
    public function listWorkersHistory(int $workOrderId): Collection
    {
        return WorkOrderWorker::query()
            ->withTrashed()
            ->with(['employee', 'createdBy', 'removedBy'])
            ->where('work_order_id', $workOrderId)
            ->orderByDesc('created_at')
            ->get();
    }

    private function nextOrderNo(): string
    {
        $prefix = 'PO-'.now()->format('Ymd');
        $last = WorkOrder::query()
            ->where('order_no', 'like', $prefix.'%')
            ->orderByDesc('order_no')
            ->value('order_no');

        $seq = $last ? ((int) substr((string) $last, -4)) + 1 : 1;

        return $prefix.'-'.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
