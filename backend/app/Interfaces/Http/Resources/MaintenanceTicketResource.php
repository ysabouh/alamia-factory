<?php

namespace App\Interfaces\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'machineId' => $this->machine_id,
            'machine' => $this->whenLoaded('machine', fn () => $this->machine?->name),
            'severity' => $this->severity,
            'status' => $this->status,
            'title' => $this->title,
            'description' => $this->description,
            'downtimeStartedAt' => $this->downtime_started_at?->toISOString(),
            'downtimeEndedAt' => $this->downtime_ended_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
