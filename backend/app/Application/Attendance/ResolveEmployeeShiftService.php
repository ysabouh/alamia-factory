<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmployeeShift;
use App\Domain\Factory\Models\Shift;
use Carbon\CarbonInterface;

class ResolveEmployeeShiftService
{
    public function resolve(Employee $employee, CarbonInterface $date): ?Shift
    {
        $assignment = EmployeeShift::query()
            ->where('employee_id', $employee->id)
            ->where('is_active', true)
            ->whereDate('effective_from', '<=', $date)
            ->where(function ($q) use ($date): void {
                $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $date);
            })
            ->with('shift')
            ->orderByDesc('effective_from')
            ->first();

        if ($assignment?->shift) {
            return $assignment->shift;
        }

        if ($employee->shift_id) {
            return Shift::query()->find($employee->shift_id);
        }

        return Shift::query()->where('is_active', true)->orderBy('code')->first();
    }
}
