<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Machines\UpdateMachineStatus;
use App\Domain\Factory\Models\Machine;
use App\Interfaces\Http\Requests\UpdateMachineStatusRequest;
use App\Interfaces\Http\Resources\MachineResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MachineController
{
    public function index(): AnonymousResourceCollection
    {
        return MachineResource::collection(
            Machine::query()
                ->with(['type', 'activeAssignment.mold', 'activeAssignment.operator', 'activeAssignment.technician'])
                ->orderBy('code')
                ->paginate()
        );
    }

    public function updateStatus(
        UpdateMachineStatusRequest $request,
        Machine $machine,
        UpdateMachineStatus $updateStatus
    ): MachineResource {
        return MachineResource::make(
            $updateStatus->handle($machine, $request->validated())->load(['type', 'activeAssignment.mold'])
        );
    }
}
