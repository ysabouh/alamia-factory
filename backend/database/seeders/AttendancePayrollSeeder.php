<?php

namespace Database\Seeders;

use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\OvertimeRequest;
use App\Domain\Factory\Models\Payroll;
use App\Domain\Factory\Models\PayrollItem;
use App\Domain\Factory\Models\Shift;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AttendancePayrollSeeder extends Seeder
{
    public function run(): void
    {
        $shift = Shift::query()->where('is_active', true)->first();
        if (! $shift) {
            return;
        }

        $employees = Employee::query()->where('is_active', true)->limit(5)->get();
        if ($employees->isEmpty()) {
            return;
        }

        $today = Carbon::today();
        foreach ($employees as $employee) {
            for ($i = 0; $i < 5; $i++) {
                $date = $today->copy()->subDays($i);
                if ($date->isFriday()) {
                    continue;
                }
                $hourly = max(0.01, (float) $employee->basic_salary / 30 / 8);
                $checkIn = $date->copy()->setTime(8, 5);
                $checkOut = $date->copy()->setTime(16, 30);
                AttendanceRecord::query()->updateOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'attendance_date' => $date->toDateString(),
                    ],
                    [
                        'check_in' => $checkIn,
                        'check_out' => $checkOut,
                        'worked_minutes' => 495,
                        'overtime_minutes' => 15,
                        'friday_overtime_minutes' => 0,
                        'late_minutes' => 5,
                        'early_leave_minutes' => 0,
                        'attendance_status' => 'late',
                        'hourly_rate' => $hourly,
                        'overtime_hourly_rate' => round($hourly * (float) config('factory.overtime.weekday_multiplier', 1.5), 4),
                        'friday_hourly_rate' => round($hourly * (float) config('factory.overtime.friday_multiplier', 2.0), 4),
                        'regular_pay' => round($hourly * 8, 2),
                        'overtime_pay' => round($hourly * 1.5 * 0.25, 2),
                        'friday_overtime_pay' => 0,
                        'total_pay' => round($hourly * 8 + $hourly * 1.5 * 0.25, 2),
                    ]
                );
            }

            OvertimeRequest::query()->firstOrCreate(
                [
                    'employee_id' => $employee->id,
                    'overtime_date' => $today->toDateString(),
                    'start_time' => '16:00:00',
                ],
                [
                    'end_time' => '18:00:00',
                    'approved_hours' => 2,
                    'reason' => 'عينة — ضغط إنتاج',
                    'status' => 'pending',
                ]
            );
        }

        $year = (int) $today->year;
        $month = (int) $today->month;
        $payroll = Payroll::query()->firstOrCreate(
            ['year' => $year, 'month' => $month],
            [
                'status' => 'draft',
                'period_start' => $today->copy()->startOfMonth()->toDateString(),
                'period_end' => $today->copy()->endOfMonth()->toDateString(),
                'generated_at' => now(),
            ]
        );

        foreach ($employees as $employee) {
            $records = AttendanceRecord::query()
                ->where('employee_id', $employee->id)
                ->whereYear('attendance_date', $year)
                ->whereMonth('attendance_date', $month)
                ->get();

            $regular = $records->sum('regular_pay');
            $ot = $records->sum('overtime_pay');
            $fot = $records->sum('friday_overtime_pay');

            PayrollItem::query()->updateOrCreate(
                ['payroll_id' => $payroll->id, 'employee_id' => $employee->id],
                [
                    'days_present' => $records->whereIn('attendance_status', ['present', 'late', 'remote'])->count(),
                    'days_absent' => $records->where('attendance_status', 'absent')->count(),
                    'total_worked_minutes' => $records->sum('worked_minutes'),
                    'total_overtime_minutes' => $records->sum('overtime_minutes'),
                    'total_friday_overtime_minutes' => $records->sum('friday_overtime_minutes'),
                    'regular_pay' => $regular,
                    'overtime_pay' => $ot,
                    'friday_overtime_pay' => $fot,
                    'total_pay' => $regular + $ot + $fot,
                    'snapshot_json' => ['days' => $records->count()],
                ]
            );
        }

        $payroll->update([
            'total_regular_pay' => $payroll->items()->sum('regular_pay'),
            'total_overtime_pay' => $payroll->items()->sum('overtime_pay'),
            'total_friday_overtime_pay' => $payroll->items()->sum('friday_overtime_pay'),
            'total_amount' => $payroll->items()->sum('total_pay'),
        ]);
    }
}
