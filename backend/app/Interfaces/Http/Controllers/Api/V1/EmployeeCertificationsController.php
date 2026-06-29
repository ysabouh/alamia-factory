<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmployeeCertification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeCertificationsController
{
    public function index(Employee $employee): JsonResponse
    {
        $rows = $employee->certifications()->orderByDesc('issued_at')->get();

        return response()->json([
            'data' => $rows->map(fn (EmployeeCertification $c) => $this->serialize($c))->values()->all(),
        ]);
    }

    public function store(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'issuer' => ['nullable', 'string', 'max:200'],
            'issuedAt' => ['nullable', 'date'],
            'issued_at' => ['nullable', 'date'],
            'expiresAt' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
            'certificateNumber' => ['nullable', 'string', 'max:100'],
            'certificate_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $cert = $employee->certifications()->create([
            'name' => $data['name'],
            'issuer' => $data['issuer'] ?? null,
            'issued_at' => $data['issuedAt'] ?? $data['issued_at'] ?? null,
            'expires_at' => $data['expiresAt'] ?? $data['expires_at'] ?? null,
            'certificate_number' => $data['certificateNumber'] ?? $data['certificate_number'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(['data' => $this->serialize($cert)], 201);
    }

    public function destroy(Employee $employee, EmployeeCertification $certification): JsonResponse
    {
        if ((int) $certification->employee_id !== (int) $employee->id) {
            abort(404);
        }
        $certification->delete();

        return response()->json(['deleted' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(EmployeeCertification $c): array
    {
        return [
            'id' => (string) $c->id,
            'employeeId' => (string) $c->employee_id,
            'name' => $c->name,
            'issuer' => $c->issuer,
            'issuedAt' => $c->issued_at?->toDateString(),
            'expiresAt' => $c->expires_at?->toDateString(),
            'certificateNumber' => $c->certificate_number,
            'notes' => $c->notes,
        ];
    }
}
