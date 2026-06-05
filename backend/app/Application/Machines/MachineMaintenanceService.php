<?php

namespace App\Application\Machines;

use App\Domain\Factory\Enums\MachineStatus;
use App\Domain\Factory\Enums\MaintenanceTicketKind;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MaintenanceAction;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Domain\Factory\Models\PreventiveMaintenanceLog;
use App\Infrastructure\Broadcasting\MachineStatusUpdated;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MachineMaintenanceService
{
    /**
     * @return Collection<int, MaintenanceTicket>
     */
    public function listTickets(Machine $machine, array $filters = []): Collection
    {
        $q = MaintenanceTicket::query()
            ->where('machine_id', $machine->id)
            ->with(['assignedTechnician', 'actions'])
            ->latest('failure_date');

        if (! empty($filters['kind'])) {
            $q->where('ticket_kind', $filters['kind']);
        }
        if (! empty($filters['status'])) {
            $q->where('status', $filters['status']);
        }
        if (! empty($filters['from'])) {
            $q->whereDate('failure_date', '>=', $filters['from']);
        }
        if (! empty($filters['to'])) {
            $q->whereDate('failure_date', '<=', $filters['to']);
        }

        return $q->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createTicket(Machine $machine, array $data, ?int $userId): MaintenanceTicket
    {
        return DB::transaction(function () use ($machine, $data, $userId): MaintenanceTicket {
            $kind = $data['ticket_kind'] ?? MaintenanceTicketKind::Breakdown->value;
            $failureDate = $data['failure_date'] ?? now()->toDateString();

            $ticket = MaintenanceTicket::query()->create([
                'machine_id' => $machine->id,
                'ticket_kind' => $kind,
                'reported_by_id' => $data['reported_by_id'] ?? null,
                'assigned_technician_id' => $data['assigned_technician_id'] ?? null,
                'severity' => $data['severity'] ?? 'medium',
                'status' => $data['status'] ?? 'open',
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'failure_date' => $failureDate,
                'downtime_started_at' => $data['downtime_started_at'] ?? now(),
                'downtime_minutes' => $data['downtime_minutes'] ?? null,
                'created_by' => $userId,
            ]);

            if ($kind === MaintenanceTicketKind::Breakdown->value) {
                $machine->update([
                    'status' => MachineStatus::Breakdown,
                    'status_note' => $data['title'],
                    'last_status_changed_at' => now(),
                ]);
                MachineStatusUpdated::dispatch($machine->fresh());
            }

            return $ticket->load(['machine', 'assignedTechnician']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateTicket(MaintenanceTicket $ticket, array $data): MaintenanceTicket
    {
        $ticket->fill($data);

        if (($data['status'] ?? null) === 'resolved') {
            $ticket->resolved_at = $data['resolved_at'] ?? now();
            if ($ticket->downtime_started_at && ! $ticket->downtime_minutes) {
                $ticket->downtime_minutes = (int) $ticket->downtime_started_at->diffInMinutes($ticket->resolved_at);
            }
        }

        $ticket->save();

        return $ticket->fresh(['machine', 'assignedTechnician', 'actions']);
    }

    /**
     * @return Collection<int, MaintenanceAction>
     */
    public function listActions(Machine $machine, array $filters = []): Collection
    {
        $q = MaintenanceAction::query()
            ->whereHas('ticket', fn ($t) => $t->where('machine_id', $machine->id))
            ->with(['ticket', 'technician'])
            ->latest('maintenance_date');

        if (! empty($filters['type'])) {
            $q->where('maintenance_type', $filters['type']);
        }

        return $q->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createAction(MaintenanceTicket $ticket, array $data): MaintenanceAction
    {
        return MaintenanceAction::query()->create([
            'maintenance_ticket_id' => $ticket->id,
            'maintenance_type' => $data['maintenance_type'] ?? 'corrective',
            'maintenance_date' => $data['maintenance_date'] ?? now()->toDateString(),
            'technician_id' => $data['technician_id'] ?? null,
            'action_taken' => $data['action_taken'],
            'parts_used' => $data['parts_used'] ?? null,
            'time_spent_minutes' => $data['time_spent_minutes'] ?? null,
            'cost' => $data['cost'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    /**
     * @return Collection<int, PreventiveMaintenanceLog>
     */
    public function listPreventiveLogs(Machine $machine): Collection
    {
        return PreventiveMaintenanceLog::query()
            ->whereHas('plan', fn ($p) => $p->where('machine_id', $machine->id))
            ->with(['plan', 'technician'])
            ->latest('performed_at')
            ->limit(50)
            ->get();
    }
}
