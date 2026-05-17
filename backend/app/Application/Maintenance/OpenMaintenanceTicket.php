<?php

namespace App\Application\Maintenance;

use App\Domain\Factory\Enums\MachineStatus;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Infrastructure\Broadcasting\MachineStatusUpdated;
use App\Infrastructure\Broadcasting\MaintenanceTicketOpened;
use Illuminate\Support\Facades\DB;

class OpenMaintenanceTicket
{
    public function handle(array $data, ?int $userId): MaintenanceTicket
    {
        return DB::transaction(function () use ($data, $userId): MaintenanceTicket {
            $ticket = MaintenanceTicket::create([
                ...$data,
                'created_by' => $userId,
                'downtime_started_at' => $data['downtime_started_at'] ?? now(),
            ]);

            $machine = Machine::findOrFail($data['machine_id']);
            $machine->update([
                'status' => MachineStatus::Maintenance,
                'status_note' => $data['title'],
                'last_status_changed_at' => now(),
            ]);

            MaintenanceTicketOpened::dispatch($ticket);
            MachineStatusUpdated::dispatch($machine);

            return $ticket;
        });
    }
}
