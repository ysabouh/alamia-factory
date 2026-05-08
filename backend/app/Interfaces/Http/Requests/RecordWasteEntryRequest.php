<?php

namespace App\Interfaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordWasteEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('production.record') ?? false;
    }

    public function rules(): array
    {
        return [
            'machine_id' => ['required', 'exists:machines,id'],
            'mold_id' => ['nullable', 'exists:molds,id'],
            'work_order_id' => ['nullable', 'exists:work_orders,id'],
            'shift_id' => ['required', 'exists:shifts,id'],
            'entry_date' => ['required', 'date'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'weight_kg' => ['nullable', 'numeric', 'min:0'],
            'reason' => ['required', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
