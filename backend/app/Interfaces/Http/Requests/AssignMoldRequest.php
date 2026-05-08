<?php

namespace App\Interfaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignMoldRequest extends FormRequest
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
            'operator_id' => ['nullable', 'exists:employees,id'],
            'technician_id' => ['nullable', 'exists:employees,id'],
            'started_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
