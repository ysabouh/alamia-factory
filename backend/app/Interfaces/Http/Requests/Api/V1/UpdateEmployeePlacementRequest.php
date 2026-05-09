<?php

namespace App\Interfaces\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeePlacementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('workforce.manage_placement') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'hall_id' => ['nullable', 'integer', 'exists:halls,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'job_role_id' => ['nullable', 'integer', 'exists:job_roles,id'],
            'shift_id' => ['nullable', 'integer', 'exists:shifts,id'],
            'employment_status_id' => ['nullable', 'integer', 'exists:employment_statuses,id'],
        ];
    }
}
