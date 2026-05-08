<?php

namespace App\Application\Machines;

use App\Domain\Factory\Models\Machine;
use App\Infrastructure\Broadcasting\MachineStatusUpdated;

class UpdateMachineStatus
{
    public function handle(Machine $machine, array $data): Machine
    {
        $machine->update([
            'status' => $data['status'],
            'status_note' => $data['status_note'] ?? null,
            'last_status_changed_at' => now(),
        ]);

        MachineStatusUpdated::dispatch($machine);

        return $machine->refresh();
    }
}
