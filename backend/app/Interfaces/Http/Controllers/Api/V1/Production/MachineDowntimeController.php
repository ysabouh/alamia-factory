<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Production;

use App\Application\Production\MachineDowntimeService;
use App\Domain\Factory\Models\MachineDowntime;
use App\Domain\Factory\Models\WorkOrder;
use App\Interfaces\Http\Support\SerializesQuality;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;

class MachineDowntimeController
{
    use SerializesQuality;

    public function __construct(
        private readonly MachineDowntimeService $downtimes,
    ) {}

    public function reasons(): JsonResponse
    {
        return response()->json([
            'data' => $this->downtimes->reasons()->map(fn ($r) => $this->serializeDowntimeReason($r))->values(),
        ]);
    }

    public function index(WorkOrder $workOrder): JsonResponse
    {
        $items = $this->downtimes->listForOrder($workOrder->id);

        return response()->json([
            'data' => $items->map(fn ($d) => $this->serializeDowntime($d))->values(),
        ]);
    }

    public function store(Request $request, WorkOrder $workOrder): JsonResponse
    {
        try {
            $data = $request->validate([
                'machineId' => ['nullable', 'integer', 'exists:machines,id'],
                'startTime' => ['nullable', 'date'],
                'endTime' => ['nullable', 'date'],
                'downtimeMinutes' => ['nullable', 'integer', 'min:0'],
                'downtimeReasonId' => ['nullable', 'integer', 'exists:downtime_reasons,id'],
                'notes' => ['nullable', 'string'],
            ]);
            $downtime = $this->downtimes->create($workOrder->id, $data, Auth::id());
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeDowntime($downtime->load(['reason', 'maintenanceTicket']))], 201);
    }

    public function update(Request $request, MachineDowntime $machineDowntime): JsonResponse
    {
        $data = $request->validate([
            'endTime' => ['nullable', 'date'],
            'downtimeMinutes' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $downtime = $this->downtimes->update($machineDowntime, $data);

        return response()->json(['data' => $this->serializeDowntime($downtime)]);
    }

    public function maintenanceRequest(Request $request, MachineDowntime $machineDowntime): JsonResponse
    {
        try {
            $data = $request->validate([
                'issueDescription' => ['nullable', 'string'],
                'priority' => ['nullable', 'string', 'in:low,medium,high,critical'],
            ]);
            $ticket = $this->downtimes->createMaintenanceRequest($machineDowntime, $data, Auth::id());
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'data' => [
                'ticketId' => (string) $ticket->id,
                'requestNo' => $ticket->request_no,
                'status' => $ticket->status,
            ],
        ], 201);
    }
}
