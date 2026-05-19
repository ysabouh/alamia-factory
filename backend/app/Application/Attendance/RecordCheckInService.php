<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\AttendanceActivityLog;
use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use Carbon\Carbon;

class RecordCheckInService
{
    public function __construct(
        private readonly AttendanceCalculatorService $calculator,
        private readonly ResolveEmployeeShiftService $resolveShift,
    ) {}

    public function handle(Employee $employee, ?Carbon $at = null): AttendanceRecord
    {
        $at ??= Carbon::now();
        $date = $at->copy()->startOfDay();

        $record = AttendanceRecord::query()->firstOrNew([
            'employee_id' => $employee->id,
            'attendance_date' => $date->toDateString(),
        ]);

        $record->check_in = $at;
        $shift = $this->resolveShift->resolve($employee, $date);
        $calc = $this->calculator->calculate(
            $employee,
            $date,
            $record->check_in ? Carbon::parse($record->check_in) : null,
            $record->check_out ? Carbon::parse($record->check_out) : null,
            $shift,
        );
        $record->fill($calc->toRecordAttributes());
        $record->save();

        AttendanceActivityLog::log(AttendanceRecord::class, (int) $record->id, 'check_in', [
            'employeeId' => $employee->id,
            'at' => $at->toIso8601String(),
        ]);

        return $record->load('employee');
    }
}
