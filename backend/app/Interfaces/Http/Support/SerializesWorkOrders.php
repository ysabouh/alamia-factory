<?php

namespace App\Interfaces\Http\Support;

use App\Domain\Factory\Models\ProductionLog;
use App\Domain\Factory\Models\WorkOrder;
use App\Domain\Factory\Models\WorkOrderWorker;

trait SerializesWorkOrders
{
    use SerializesQuality;
    /**
     * @return array<string, mixed>
     */
    protected function serializeWorkOrder(WorkOrder $order, bool $detail = false): array
    {
        $producedQty = $order->relationLoaded('logs')
            ? (int) $order->logs->sum('good_quantity')
            : (int) $order->logs()->sum('good_quantity');

        $payload = [
            'id' => (string) $order->id,
            'orderNo' => $order->order_no ?? $order->code,
            'code' => $order->code,
            'productId' => (string) $order->product_id,
            'productCode' => $order->product?->product_code ?? $order->product?->code,
            'productName' => $order->product?->product_name_ar ?? $order->product?->name,
            'productImageUrl' => $this->primaryEntityImageUrl($order->product),
            'productionDate' => $order->production_date?->toDateString(),
            'machineId' => $order->machine_id ? (string) $order->machine_id : null,
            'machineCode' => $order->machine?->code,
            'machineName' => $order->machine?->name,
            'machineBrand' => $order->machine?->brand,
            'machineModel' => $order->machine?->model,
            'machineImageUrl' => $this->primaryEntityImageUrl($order->machine),
            'machineTypeId' => $order->machine?->machine_type_id ? (string) $order->machine->machine_type_id : null,
            'machineTypeName' => $order->machine?->type?->name ?? $order->machine?->type?->code,
            'moldId' => $order->mold_id ? (string) $order->mold_id : null,
            'moldCode' => $order->mold?->code,
            'moldName' => $order->mold?->name,
            'moldImageUrl' => $this->primaryEntityImageUrl($order->mold),
            'moldType' => $order->mold?->mold_type?->value ?? $order->mold?->mold_type,
            'shiftId' => $order->shift_id ? (string) $order->shift_id : null,
            'shiftName' => $order->shift?->name,
            'supervisorId' => $order->supervisor_id ? (string) $order->supervisor_id : null,
            'supervisorName' => $order->supervisor?->full_name ?? $order->supervisor?->name,
            'productionManagerId' => $order->production_manager_id ? (string) $order->production_manager_id : null,
            'productionManagerName' => $order->productionManager?->full_name ?? $order->productionManager?->name,
            'plannedQuantity' => $order->planned_quantity ?? $order->target_quantity,
            'producedQuantity' => $producedQty,
            'priority' => $order->priority,
            'status' => $order->status?->value ?? $order->status,
            'dueDate' => $order->due_date?->toDateString(),
            'startTime' => $order->start_time?->toIso8601String(),
            'endTime' => $order->end_time?->toIso8601String(),
            'productOperationId' => $order->product_operation_id ? (string) $order->product_operation_id : null,
            'notes' => $order->notes,
            'createdAt' => $order->created_at?->toIso8601String(),
            'updatedAt' => $order->updated_at?->toIso8601String(),
        ];

        if (! $detail) {
            return $payload;
        }

        return array_merge($payload, [
            'workers' => $order->relationLoaded('workers')
                ? $order->workers->map(fn (WorkOrderWorker $w) => $this->serializeWorker($w))->values()->all()
                : [],
            'logs' => $order->relationLoaded('logs')
                ? $order->logs->map(fn (ProductionLog $l) => $this->serializeLog($l))->values()->all()
                : [],
            'inspections' => $order->relationLoaded('inspections')
                ? $order->inspections->map(fn ($i) => $this->serializeInspection($i))->values()->all()
                : [],
            'downtimes' => $order->relationLoaded('downtimes')
                ? $order->downtimes->map(fn ($d) => $this->serializeDowntime($d))->values()->all()
                : [],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeWorker(WorkOrderWorker $worker): array
    {
        $employee = $worker->employee;

        return [
            'id' => (string) $worker->id,
            'employeeId' => (string) $worker->employee_id,
            'employeeName' => $employee?->full_name ?? $employee?->name,
            'role' => $worker->role?->value ?? $worker->role,
            'effectiveFrom' => $worker->effective_from?->toIso8601String(),
            'createdAt' => $worker->created_at?->toIso8601String(),
            'createdByName' => $worker->createdBy?->name,
            'removedAt' => $worker->deleted_at?->toIso8601String(),
            'removedByName' => $worker->removedBy?->name,
            'isActive' => $worker->deleted_at === null,
            'employee' => $employee ? [
                'id' => (string) $employee->id,
                'fullName' => $employee->full_name,
                'employeeNumber' => (string) ($employee->employee_number ?? $employee->code ?? ''),
                'birthDate' => $employee->birth_date?->toDateString(),
                'age' => $employee->birth_date ? $employee->birth_date->age : null,
                'profileImage' => $employee->profile_image,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeLog(ProductionLog $log): array
    {
        return [
            'id' => (string) $log->id,
            'fromTime' => $log->from_time?->toIso8601String(),
            'toTime' => $log->to_time?->toIso8601String(),
            'goodQuantity' => $log->good_quantity,
            'scrapQuantity' => $log->scrap_quantity,
            'notes' => $log->notes,
            'createdByName' => $log->creator?->name,
            'createdAt' => $log->created_at?->toIso8601String(),
        ];
    }

    protected function primaryEntityImageUrl(?object $entity): ?string
    {
        if ($entity === null) {
            return null;
        }

        $direct = $entity->image_url ?? null;
        if (! empty($direct)) {
            return (string) $direct;
        }

        if (method_exists($entity, 'relationLoaded') && $entity->relationLoaded('images')) {
            $images = $entity->images;
            if ($images && $images->isNotEmpty()) {
                $primary = $images->firstWhere('is_primary', true) ?? $images->first();

                return $primary?->image_url;
            }
        }

        return null;
    }
}
