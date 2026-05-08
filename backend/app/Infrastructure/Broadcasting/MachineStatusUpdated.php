<?php

namespace App\Infrastructure\Broadcasting;

use App\Domain\Factory\Models\Machine;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MachineStatusUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public Machine $machine)
    {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('factory.live-dashboard'),
            new PrivateChannel('machines.'.$this->machine->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'machine_id' => $this->machine->id,
            'status' => $this->machine->status->value,
            'status_note' => $this->machine->status_note,
        ];
    }
}
