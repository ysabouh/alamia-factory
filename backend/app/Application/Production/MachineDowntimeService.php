<?php

namespace App\Application\Production;

use App\Application\Maintenance\OpenMaintenanceTicket;
use App\Domain\Factory\Enums\MaintenanceTicketKind;
use App\Domain\Factory\Models\DowntimeReason;
use App\Domain\Factory\Models\MachineDowntime;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Domain\Factory\Models\WorkOrder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MachineDowntimeService
{
    public function __construct(
        private readonly OpenMaintenanceTicket $openMaintenanceTicket,
    ) {}

    /**
     * @return Collection<int, MachineDowntime>
     */
    public function listForOrder(int $workOrderId): Collection
    {
        return MachineDowntime::query()
            ->where('work_order_id', $workOrderId)
            ->with(['reason', 'maintenanceTicket'])
            ->orderByDesc('start_time')
            ->get();
    }

    /**
     * @return Collection<int, DowntimeReason>
     */
    public function reasons(): Collection
    {
        return DowntimeReason::query()->where('is_active', true)->orderBy('name')->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(int $workOrderId, array $data, ?int $userId): MachineDowntime
    {
        $order = WorkOrder::query()->findOrFail($workOrderId);
        $machineId = (int) ($data['machineId'] ?? $order->machine_id);

        if ($machineId <= 0) {
            throw new InvalidArgumentException('يجب تحديد الماكينة للتوقف.');
        }

        return DB::transaction(function () use ($workOrderId, $data, $machineId, $userId): MachineDowntime {
            $start = $data['startTime'] ?? now();
            $end = $data['endTime'] ?? null;
            $minutes = null;

            if ($end !== null) {
                $minutes = max(0, (int) round((strtotime((string) $end) - strtotime((string) $start)) / 60));
            }

            return MachineDowntime::query()->create([
                'work_order_id' => $workOrderId,
                'machine_id' => $machineId,
                'start_time' => $start,
                'end_time' => $end,
                'downtime_minutes' => $data['downtimeMinutes'] ?? $minutes,
                'downtime_reason_id' => ! empty($data['downtimeReasonId']) ? (int) $data['downtimeReasonId'] : null,
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(MachineDowntime $downtime, array $data): MachineDowntime
    {
        if (array_key_exists('endTime', $data)) {
            $downtime->end_time = $data['endTime'];
        }
        if (array_key_exists('downtimeMinutes', $data)) {
            $downtime->downtime_minutes = (int) $data['downtimeMinutes'];
        } elseif ($downtime->end_time !== null && $downtime->start_time !== null) {
            $downtime->downtime_minutes = max(0, (int) $downtime->start_time->diffInMinutes($downtime->end_time));
        }
        if (array_key_exists('notes', $data)) {
            $downtime->notes = $data['notes'];
        }
        $downtime->save();

        return $downtime->fresh(['reason', 'maintenanceTicket']);
    }

    public function createMaintenanceRequest(MachineDowntime $downtime, array $data, ?int $userId): MaintenanceTicket
    {
        if ($downtime->maintenanceTicket !== null) {
            throw new InvalidArgumentException('يوجد طلب صيانة مرتبط بهذا التوقف بالفعل.');
        }

        $requestNo = 'MR-'.now()->format('Ymd').'-'.str_pad((string) $downtime->id, 4, '0', STR_PAD_LEFT);

        $ticket = $this->openMaintenanceTicket->handle([
            'machine_id' => $downtime->machine_id,
            'ticket_kind' => MaintenanceTicketKind::Breakdown->value,
            'severity' => $data['priority'] ?? $data['severity'] ?? 'high',
            'title' => $data['issueDescription'] ?? $data['title'] ?? 'طلب صيانة من أمر إنتاج',
            'description' => $data['issueDescription'] ?? $data['description'] ?? $downtime->notes,
            'failure_date' => now()->toDateString(),
            'downtime_started_at' => $downtime->start_time,
        ], $userId);

        $ticket->update([
            'work_order_id' => $downtime->work_order_id,
            'machine_downtime_id' => $downtime->id,
            'request_no' => $requestNo,
        ]);

        return $ticket->fresh();
    }
}
