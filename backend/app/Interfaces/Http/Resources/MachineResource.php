<?php

namespace App\Interfaces\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MachineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'type' => $this->type?->code,
            'capacity' => $this->capacity,
            'location' => $this->location,
            'status' => $this->status->value,
            'statusNote' => $this->status_note,
            'lastStatusChangedAt' => $this->last_status_changed_at?->toISOString(),
            'activeAssignment' => $this->whenLoaded('activeAssignment', fn () => [
                'id' => $this->activeAssignment?->id,
                'mold' => $this->activeAssignment?->mold?->name,
                'operator' => $this->activeAssignment?->operator?->name,
                'technician' => $this->activeAssignment?->technician?->name,
            ]),
        ];
    }
}
