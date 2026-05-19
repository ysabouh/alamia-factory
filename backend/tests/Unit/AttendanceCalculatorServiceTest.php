<?php

namespace Tests\Unit;

use App\Application\Attendance\AttendanceCalculatorService;
use App\Application\Attendance\ResolveEmployeeShiftService;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\Shift;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class AttendanceCalculatorServiceTest extends TestCase
{
    public function test_friday_overtime_goes_to_friday_bucket(): void
    {
        $shift = new Shift([
            'starts_at' => '08:00:00',
            'ends_at' => '16:00:00',
            'break_minutes' => 0,
            'overtime_multiplier' => 1.5,
            'friday_multiplier' => 2.0,
        ]);

        $employee = new Employee(['basic_salary' => 4800]);

        $friday = Carbon::parse('2026-05-22'); // a Friday
        $checkIn = $friday->copy()->setTime(8, 0);
        $checkOut = $friday->copy()->setTime(18, 0);

        $calc = new AttendanceCalculatorService(new ResolveEmployeeShiftService);
        $result = $calc->calculate($employee, $friday, $checkIn, $checkOut, $shift);

        $this->assertGreaterThan(0, $result->fridayOvertimeMinutes);
        $this->assertSame(0, $result->overtimeMinutes);
    }

    public function test_negative_overtime_is_zero(): void
    {
        $shift = new Shift([
            'starts_at' => '08:00:00',
            'ends_at' => '16:00:00',
            'break_minutes' => 0,
        ]);

        $employee = new Employee(['basic_salary' => 3000]);
        $date = Carbon::parse('2026-05-19');
        $checkIn = $date->copy()->setTime(8, 0);
        $checkOut = $date->copy()->setTime(12, 0);

        $calc = new AttendanceCalculatorService(new ResolveEmployeeShiftService);
        $result = $calc->calculate($employee, $date, $checkIn, $checkOut, $shift);

        $this->assertSame(0, $result->overtimeMinutes);
        $this->assertSame(0, $result->fridayOvertimeMinutes);
    }

    public function test_unpaid_leave_has_zero_hours_and_pay(): void
    {
        $shift = new Shift([
            'starts_at' => '08:00:00',
            'ends_at' => '16:00:00',
            'break_minutes' => 0,
        ]);

        $employee = new Employee(['basic_salary' => 4800]);
        $date = Carbon::parse('2026-05-19');

        $calc = new AttendanceCalculatorService(new ResolveEmployeeShiftService);
        $result = $calc->calculate($employee, $date, null, null, $shift, 'unpaid_leave');

        $this->assertSame('unpaid_leave', $result->attendanceStatus);
        $this->assertSame(0, $result->workedMinutes);
        $this->assertSame(0.0, $result->totalPay);
    }
}
