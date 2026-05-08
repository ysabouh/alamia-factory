<?php

namespace App\Interfaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordProductionEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('production.record') ?? false;
    }

    public function rules(): array
    {
        return [
            'machine_id' => ['required', 'exists:machines,id'],
            'mold_id' => ['required', 'exists:molds,id'],
            'work_order_id' => ['nullable', 'exists:work_orders,id'],
            'shift_id' => ['required', 'exists:shifts,id'],
            'entry_date' => ['required', 'date'],
            'produced_pieces' => ['required', 'integer', 'min:0'],
            'produced_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'piece_weight_grams' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
