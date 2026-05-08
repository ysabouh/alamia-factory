<?php

namespace App\Interfaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OpenMaintenanceTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('maintenance.open_ticket') ?? false;
    }

    public function rules(): array
    {
        return [
            'machine_id' => ['required', 'exists:machines,id'],
            'reported_by_id' => ['nullable', 'exists:employees,id'],
            'assigned_technician_id' => ['nullable', 'exists:employees,id'],
            'severity' => ['required', 'in:low,medium,high,critical'],
            'title' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string'],
            'downtime_started_at' => ['nullable', 'date'],
        ];
    }
}
