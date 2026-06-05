<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Machines;

use App\Application\Machines\MachineCounterService;
use App\Domain\Factory\Models\Machine;
use App\Interfaces\Http\Support\SerializesMachines;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MachineCountersController
{
    use SerializesMachines;

    public function __construct(
        private readonly MachineCounterService $counters,
    ) {}

    public function index(Request $request, Machine $machine): JsonResponse
    {
        $rows = $this->counters->list(
            $machine,
            $request->query('from'),
            $request->query('to'),
        );

        return response()->json([
            'data' => $rows->map(fn ($c) => $this->serializeMachineCounter($c))->values(),
        ]);
    }

    public function store(Request $request, Machine $machine): JsonResponse
    {
        $data = $request->validate([
            'counterDate' => ['required', 'date'],
            'producedUnits' => ['sometimes', 'integer', 'min:0'],
            'rejectedUnits' => ['sometimes', 'integer', 'min:0'],
            'runningHours' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $counter = $this->counters->upsert($machine, [
            'counter_date' => $data['counterDate'],
            'produced_units' => $data['producedUnits'] ?? 0,
            'rejected_units' => $data['rejectedUnits'] ?? 0,
            'running_hours' => $data['runningHours'] ?? 0,
        ]);

        return response()->json(['data' => $this->serializeMachineCounter($counter)], 201);
    }
}
