<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Machines;

use App\Application\Machines\MachineMaintenanceService;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Interfaces\Http\Support\SerializesMachines;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MachineMaintenanceController
{
    use SerializesMachines;

    public function __construct(
        private readonly MachineMaintenanceService $maintenance,
    ) {}

    public function tickets(Request $request, Machine $machine): JsonResponse
    {
        $rows = $this->maintenance->listTickets($machine, [
            'kind' => $request->query('kind', $request->query('ticketKind')),
            'status' => $request->query('status'),
            'from' => $request->query('from'),
            'to' => $request->query('to'),
        ]);

        return response()->json([
            'data' => $rows->map(fn ($t) => $this->serializeMaintenanceTicket($t))->values(),
        ]);
    }

    public function storeTicket(Request $request, Machine $machine): JsonResponse
    {
        $data = $request->validate([
            'ticketKind' => ['sometimes', 'in:breakdown,maintenance'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'severity' => ['sometimes', 'in:low,medium,high,critical'],
            'status' => ['sometimes', 'in:open,in_progress,resolved'],
            'failureDate' => ['sometimes', 'date'],
            'downtimeMinutes' => ['nullable', 'integer', 'min:0'],
            'assignedTechnicianId' => ['nullable', 'integer', 'exists:employees,id'],
        ]);

        $ticket = $this->maintenance->createTicket($machine, [
            'ticket_kind' => $data['ticketKind'] ?? 'breakdown',
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'severity' => $data['severity'] ?? 'medium',
            'status' => $data['status'] ?? 'open',
            'failure_date' => $data['failureDate'] ?? null,
            'downtime_minutes' => $data['downtimeMinutes'] ?? null,
            'assigned_technician_id' => $data['assignedTechnicianId'] ?? null,
        ], $request->user()?->id);

        return response()->json(['data' => $this->serializeMaintenanceTicket($ticket)], 201);
    }

    public function updateTicket(Request $request, Machine $machine, MaintenanceTicket $ticket): JsonResponse
    {
        abort_if((int) $ticket->machine_id !== (int) $machine->id, 404);

        $data = $request->validate([
            'status' => ['sometimes', 'in:open,in_progress,resolved'],
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'resolvedAt' => ['nullable', 'date'],
            'downtimeMinutes' => ['nullable', 'integer', 'min:0'],
        ]);

        $updated = $this->maintenance->updateTicket($ticket, [
            'status' => $data['status'] ?? $ticket->status,
            'title' => $data['title'] ?? $ticket->title,
            'description' => $data['description'] ?? $ticket->description,
            'resolved_at' => $data['resolvedAt'] ?? null,
            'downtime_minutes' => $data['downtimeMinutes'] ?? $ticket->downtime_minutes,
        ]);

        return response()->json(['data' => $this->serializeMaintenanceTicket($updated)]);
    }

    public function actions(Request $request, Machine $machine): JsonResponse
    {
        $rows = $this->maintenance->listActions($machine, [
            'type' => $request->query('type'),
        ]);

        return response()->json([
            'data' => $rows->map(fn ($a) => $this->serializeMaintenanceAction($a))->values(),
        ]);
    }

    public function storeAction(Request $request, Machine $machine, MaintenanceTicket $ticket): JsonResponse
    {
        abort_if((int) $ticket->machine_id !== (int) $machine->id, 404);

        $data = $request->validate([
            'maintenanceType' => ['sometimes', 'in:preventive,corrective,emergency'],
            'maintenanceDate' => ['sometimes', 'date'],
            'technicianId' => ['nullable', 'integer', 'exists:employees,id'],
            'actionTaken' => ['required', 'string'],
            'timeSpentMinutes' => ['nullable', 'integer', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $action = $this->maintenance->createAction($ticket, [
            'maintenance_type' => $data['maintenanceType'] ?? 'corrective',
            'maintenance_date' => $data['maintenanceDate'] ?? null,
            'technician_id' => $data['technicianId'] ?? null,
            'action_taken' => $data['actionTaken'],
            'time_spent_minutes' => $data['timeSpentMinutes'] ?? null,
            'cost' => $data['cost'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(['data' => $this->serializeMaintenanceAction($action)], 201);
    }

    public function preventiveLogs(Machine $machine): JsonResponse
    {
        $rows = $this->maintenance->listPreventiveLogs($machine);

        return response()->json([
            'data' => $rows->map(fn ($l) => $this->serializePreventiveLog($l))->values(),
        ]);
    }
}
