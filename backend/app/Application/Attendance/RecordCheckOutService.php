<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\AttendanceActivityLog;
use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use Carbon\Carbon;
use RuntimeException;

class RecordCheckOutService
{
    public function __construct(
        private readonly AttendanceCalculatorService $calculator,
        private readonly ResolveEmployeeShiftService $resolveShift,
    ) {}

    public function handle(Employee $employee, ?Carbon $at = null): AttendanceRecord
    {
        $at ??= Carbon::now();
        $date = $at->copy()->startOfDay();

        $record = AttendanceRecord::query()
            ->where('employee_id', $employee->id)
            ->whereDate('attendance_date', $date)
            ->first();

        if (! $record || ! $record->check_in) {
            throw new RuntimeException(__('factory.attendance_check_in_required'));
        }

        $record->check_out = $at;
        $shift = $this->resolveShift->resolve($employee, $date);
        $calc = $this->calculator->calculate(
            $employee,
            $date,
            Carbon::parse($record->check_in),
            Carbon::parse($record->check_out),
            $shift,
        );
        $record->fill($calc->toRecordAttributes());
        $record->save();

        AttendanceActivityLog::log(AttendanceRecord::class, (int) $record->id, 'check_out', [
            'employeeId' => $employee->id,
            'at' => $at->toIso8601String(),
        ]);

        return $record->load('employee');
    }
}
