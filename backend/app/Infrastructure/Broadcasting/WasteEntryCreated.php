<?php

namespace App\Infrastructure\Broadcasting;

use App\Domain\Factory\Models\WasteEntry;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WasteEntryCreated implements ShouldBroadcast
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public WasteEntry $entry)
    {
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('factory.live-dashboard')];
    }

    public function broadcastWith(): array
    {
        return [
            'entry_id' => $this->entry->id,
            'machine_id' => $this->entry->machine_id,
            'quantity' => $this->entry->quantity,
            'weight_kg' => $this->entry->weight_kg,
            'reason' => $this->entry->reason,
        ];
    }
}
