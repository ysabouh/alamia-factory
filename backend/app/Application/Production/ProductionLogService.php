<?php

namespace App\Application\Production;

use App\Domain\Factory\Enums\WorkOrderStatus;
use App\Domain\Factory\Models\ProductionLog;
use App\Domain\Factory\Models\WorkOrder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ProductionLogService
{
    /**
     * @return Collection<int, ProductionLog>
     */
    public function listForOrder(int $workOrderId): Collection
    {
        return ProductionLog::query()
            ->where('work_order_id', $workOrderId)
            ->with('creator')
            ->orderByDesc('from_time')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(int $workOrderId, array $data, ?int $userId): ProductionLog
    {
        $order = WorkOrder::query()->findOrFail($workOrderId);

        if ($order->status !== WorkOrderStatus::Running) {
            throw new InvalidArgumentException('يمكن تسجيل الإنتاج فقط لأمر قيد التشغيل.');
        }

        return DB::transaction(function () use ($workOrderId, $data, $userId): ProductionLog {
            return ProductionLog::query()->create([
                'work_order_id' => $workOrderId,
                'from_time' => $data['fromTime'],
                'to_time' => $data['toTime'],
                'good_quantity' => (int) ($data['goodQuantity'] ?? 0),
                'scrap_quantity' => (int) ($data['scrapQuantity'] ?? 0),
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);
        });
    }
}
