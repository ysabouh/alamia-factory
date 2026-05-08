<?php

namespace App\Infrastructure\Broadcasting;

use App\Domain\Factory\Models\ProductionEntry;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductionEntryCreated implements ShouldBroadcast
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public ProductionEntry $entry)
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
            'produced_pieces' => $this->entry->produced_pieces,
            'produced_weight_kg' => $this->entry->produced_weight_kg,
        ];
    }
}
