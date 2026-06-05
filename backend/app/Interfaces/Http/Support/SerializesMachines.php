<?php

namespace App\Interfaces\Http\Support;

use App\Application\Machines\MachineSpecRegistry;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineCounter;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\MaintenanceAction;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Domain\Factory\Models\PreventiveMaintenanceLog;

trait SerializesMachines
{
    /**
     * @return array<string, mixed>
     */
    protected function serializeMachineType(MachineType $type): array
    {
        return [
            'id' => (string) $type->id,
            'code' => $type->code,
            'name' => $type->name,
            'description' => $type->description,
            'isActive' => (bool) $type->is_active,
            'createdAt' => $type->created_at?->toIso8601String(),
            'updatedAt' => $type->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeMachine(Machine $machine, bool $detail = false): array
    {
        $registry = app(MachineSpecRegistry::class);
        $type = $machine->relationLoaded('type') ? $machine->type : null;

        $base = [
            'id' => (string) $machine->id,
            'code' => $machine->code,
            'name' => $machine->name,
            'machineTypeId' => (string) $machine->machine_type_id,
            'type' => $type?->code,
            'typeName' => $type?->name,
            'brand' => $machine->brand,
            'model' => $machine->model,
            'serialNumber' => $machine->serial_number,
            'factorySection' => $machine->factory_section,
            'productionLine' => $machine->production_line,
            'powerKw' => $machine->power_kw !== null ? (float) $machine->power_kw : null,
            'hourlyEnergyConsumption' => $machine->hourly_energy_consumption !== null
                ? (float) $machine->hourly_energy_consumption
                : null,
            'installationDate' => $machine->installation_date?->toDateString(),
            'notes' => $machine->notes,
            'isActive' => (bool) $machine->is_active,
            'status' => $machine->status->value,
            'statusNote' => $machine->status_note,
            'lastStatusChangedAt' => $machine->last_status_changed_at?->toIso8601String(),
            'todayProducedUnits' => (int) ($machine->today_produced_sum ?? 0),
            'openBreakdownCount' => (int) ($machine->open_breakdown_count ?? 0),
            'createdAt' => $machine->created_at?->toIso8601String(),
            'updatedAt' => $machine->updated_at?->toIso8601String(),
        ];

        if (! $detail) {
            return $base;
        }

        return array_merge($base, [
            'spec' => $registry->serialize($machine),
            'activeAssignment' => $machine->relationLoaded('activeAssignment') && $machine->activeAssignment
                ? [
                    'id' => (string) $machine->activeAssignment->id,
                    'mold' => $machine->activeAssignment->mold?->name,
                ]
                : null,
            'recentTickets' => $machine->relationLoaded('maintenanceTickets')
                ? $machine->maintenanceTickets->map(fn (MaintenanceTicket $t) => $this->serializeMaintenanceTicket($t))->values()->all()
                : [],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeMachineCounter(MachineCounter $counter): array
    {
        return [
            'id' => (string) $counter->id,
            'machineId' => (string) $counter->machine_id,
            'counterDate' => $counter->counter_date?->toDateString(),
            'producedUnits' => (int) $counter->produced_units,
            'rejectedUnits' => (int) $counter->rejected_units,
            'runningHours' => (float) $counter->running_hours,
            'createdAt' => $counter->created_at?->toIso8601String(),
            'updatedAt' => $counter->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeMaintenanceTicket(MaintenanceTicket $ticket): array
    {
        return [
            'id' => (string) $ticket->id,
            'machineId' => (string) $ticket->machine_id,
            'ticketKind' => $ticket->ticket_kind?->value ?? $ticket->ticket_kind,
            'severity' => $ticket->severity,
            'status' => $ticket->status,
            'title' => $ticket->title,
            'description' => $ticket->description,
            'failureDate' => $ticket->failure_date?->toDateString(),
            'downtimeStartedAt' => $ticket->downtime_started_at?->toIso8601String(),
            'downtimeEndedAt' => $ticket->downtime_ended_at?->toIso8601String(),
            'resolvedAt' => $ticket->resolved_at?->toIso8601String(),
            'downtimeMinutes' => $ticket->downtime_minutes,
            'assignedTechnicianName' => $ticket->assignedTechnician?->full_name ?? $ticket->assignedTechnician?->name,
            'createdAt' => $ticket->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeMaintenanceAction(MaintenanceAction $action): array
    {
        return [
            'id' => (string) $action->id,
            'maintenanceTicketId' => (string) $action->maintenance_ticket_id,
            'maintenanceType' => $action->maintenance_type?->value ?? $action->maintenance_type,
            'maintenanceDate' => $action->maintenance_date?->toDateString(),
            'technicianId' => $action->technician_id ? (string) $action->technician_id : null,
            'technicianName' => $action->technician?->full_name ?? $action->technician?->name,
            'actionTaken' => $action->action_taken,
            'timeSpentMinutes' => $action->time_spent_minutes,
            'cost' => $action->cost !== null ? (float) $action->cost : null,
            'notes' => $action->notes,
            'createdAt' => $action->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializePreventiveLog(PreventiveMaintenanceLog $log): array
    {
        return [
            'id' => (string) $log->id,
            'planName' => $log->plan?->name,
            'performedAt' => $log->performed_at?->toIso8601String(),
            'technicianName' => $log->technician?->full_name ?? $log->technician?->name,
            'notes' => $log->notes,
        ];
    }
}
