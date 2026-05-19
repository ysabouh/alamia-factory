<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmployeeShift;
use App\Domain\Factory\Models\Shift;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AssignEmployeeShiftService
{
    public function handle(Employee $employee, Shift $shift, Carbon $effectiveFrom, ?Carbon $effectiveTo = null): EmployeeShift
    {
        return DB::transaction(function () use ($employee, $shift, $effectiveFrom, $effectiveTo) {
            EmployeeShift::query()
                ->where('employee_id', $employee->id)
                ->where('is_active', true)
                ->update([
                    'is_active' => false,
                    'effective_to' => $effectiveFrom->copy()->subDay()->toDateString(),
                ]);

            $assignment = EmployeeShift::query()->create([
                'employee_id' => $employee->id,
                'shift_id' => $shift->id,
                'effective_from' => $effectiveFrom->toDateString(),
                'effective_to' => $effectiveTo?->toDateString(),
                'is_active' => true,
            ]);

            $employee->update(['shift_id' => $shift->id]);

            return $assignment->load('shift');
        });
    }
}
