<?php

namespace App\Interfaces\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMachineStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('machines.update_status') ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:running,idle,maintenance,down'],
            'status_note' => ['nullable', 'string', 'max:255'],
        ];
    }
}
