<?php

namespace App\Interfaces\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WasteEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'machineId' => $this->machine_id,
            'moldId' => $this->mold_id,
            'workOrderId' => $this->work_order_id,
            'shiftId' => $this->shift_id,
            'entryDate' => $this->entry_date?->toDateString(),
            'quantity' => $this->quantity,
            'weightKg' => $this->weight_kg,
            'reason' => $this->reason,
            'notes' => $this->notes,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
