<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Workforce\BuildWorkforceRoster;
use App\Domain\Factory\Models\Currency;
use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmploymentStatus;
use App\Domain\Factory\Models\Hall;
use App\Domain\Factory\Models\JobRole;
use App\Domain\Factory\Models\Shift;
use App\Interfaces\Http\Requests\Api\V1\UpdateEmployeePlacementRequest;
use Illuminate\Http\JsonResponse;

class WorkforceController
{
    public function roster(BuildWorkforceRoster $roster): JsonResponse
    {
        return response()->json(['data' => $roster->handle()]);
    }

    public function meta(): JsonResponse
    {
        $halls = Hall::query()
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'name', 'code', 'hall_type'])
            ->map(fn (Hall $h): array => [
                'id' => $h->id,
                'name' => $h->name,
                'code' => $h->code,
                'hallType' => $h->hall_type,
            ]);

        $departments = Department::query()
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'hall_id', 'name', 'code'])
            ->map(fn (Department $d): array => [
                'id' => $d->id,
                'hallId' => $d->hall_id,
                'name' => $d->name,
                'code' => $d->code,
            ]);

        $jobRoles = JobRole::query()
            ->where('is_active', true)
            ->orderBy('role_level')
            ->orderBy('code')
            ->get(['id', 'name', 'code', 'role_level'])
            ->map(fn (JobRole $r): array => [
                'id' => $r->id,
                'name' => $r->name,
                'code' => $r->code,
                'roleLevel' => $r->role_level,
            ]);

        $shifts = Shift::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'starts_at', 'ends_at'])
            ->map(fn (Shift $s): array => [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code,
                'startsAt' => $s->starts_at?->format('H:i'),
                'endsAt' => $s->ends_at?->format('H:i'),
            ]);

        $statuses = EmploymentStatus::query()
            ->orderBy('code')
            ->get(['id', 'name', 'code'])
            ->map(fn (EmploymentStatus $s): array => [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code,
            ]);

        $currencies = Currency::query()
            ->where('is_active', true)
            ->orderByDesc('is_base')
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'symbol', 'usd_exchange_rate', 'is_base'])
            ->map(fn (Currency $c): array => [
                'id' => (string) $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'symbol' => $c->symbol,
                'usdExchangeRate' => (float) $c->usd_exchange_rate,
                'isBase' => (bool) $c->is_base,
            ]);

        $baseCurrency = Currency::query()->where('is_base', true)->first();

        return response()->json([
            'data' => [
                'halls' => $halls,
                'departments' => $departments,
                'jobRoles' => $jobRoles,
                'shifts' => $shifts,
                'employmentStatuses' => $statuses,
                'currencies' => $currencies,
                'baseCurrencyCode' => $baseCurrency?->code ?? config('factory.currency.base_code', 'USD'),
            ],
        ]);
    }

    public function updatePlacement(UpdateEmployeePlacementRequest $request, Employee $employee): JsonResponse
    {
        $employee->fill($request->validated());
        $employee->save();

        $employee->load([
            'hall:id,name,code',
            'organizationalDepartment:id,name,code',
            'jobRole:id,name,code',
            'shift:id,name,code',
            'employmentStatus:id,name,code',
        ]);

        return response()->json([
            'data' => [
                'id' => $employee->id,
                'employeeNumber' => $employee->employee_number ?? $employee->code,
                'fullName' => $employee->full_name,
                'hallId' => $employee->hall_id,
                'departmentId' => $employee->department_id,
                'jobRoleId' => $employee->job_role_id,
                'shiftId' => $employee->shift_id,
                'employmentStatusId' => $employee->employment_status_id,
            ],
        ]);
    }
}
