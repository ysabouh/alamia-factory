<?php

namespace App\Infrastructure\Broadcasting;

use App\Domain\Factory\Models\MaintenanceTicket;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MaintenanceTicketOpened implements ShouldBroadcast
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public MaintenanceTicket $ticket)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('factory.live-dashboard')];
    }

    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'machine_id' => $this->ticket->machine_id,
            'severity' => $this->ticket->severity,
            'title' => $this->ticket->title,
        ];
    }
}
