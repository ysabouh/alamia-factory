<?php

namespace App\Jobs;

use App\Application\Attendance\AttendanceCalculatorService;
use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class MarkAbsentEmployeesJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly ?string $date = null,
    ) {}

    public function handle(AttendanceCalculatorService $calculator): void
    {
        $date = $this->date
            ? Carbon::parse($this->date)->startOfDay()
            : Carbon::yesterday()->startOfDay();

        $employees = Employee::query()->where('is_active', true)->get();

        foreach ($employees as $employee) {
            $exists = AttendanceRecord::query()
                ->where('employee_id', $employee->id)
                ->whereDate('attendance_date', $date)
                ->exists();

            if ($exists) {
                continue;
            }

            $calc = $calculator->calculate($employee, $date, null, null, null, 'absent');
            AttendanceRecord::query()->create(array_merge([
                'employee_id' => $employee->id,
                'attendance_date' => $date->toDateString(),
            ], $calc->toRecordAttributes()));
        }
    }
}
