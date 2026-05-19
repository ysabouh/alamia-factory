<?php

namespace App\Application\Attendance;

use App\Application\Attendance\DTO\AttendanceCalculationResult;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\Shift;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class AttendanceCalculatorService
{
    private const LATE_GRACE_MINUTES = 5;

    public function __construct(
        private readonly ResolveEmployeeShiftService $resolveShift
    ) {}

    public function calculate(
        Employee $employee,
        CarbonInterface $attendanceDate,
        ?CarbonInterface $checkIn,
        ?CarbonInterface $checkOut,
        ?Shift $shift = null,
        ?string $forcedStatus = null,
    ): AttendanceCalculationResult {
        $hourly = $this->hourlyRate($employee);

        if ($forcedStatus === 'absent' || ($checkIn === null && $checkOut === null && $forcedStatus === null)) {
            $otRate = $this->overtimeHourlyRate($employee, null, $hourly);
            $fridayRate = $this->fridayHourlyRate($employee, null, $hourly);
            return new AttendanceCalculationResult(
                workedMinutes: 0,
                overtimeMinutes: 0,
                fridayOvertimeMinutes: 0,
                lateMinutes: 0,
                earlyLeaveMinutes: 0,
                attendanceStatus: $forcedStatus ?? 'absent',
                hourlyRate: $hourly,
                overtimeHourlyRate: $otRate,
                fridayHourlyRate: $fridayRate,
                regularPay: 0,
                overtimePay: 0,
                fridayOvertimePay: 0,
                totalPay: 0,
            );
        }

        if ($forcedStatus === 'unpaid_leave' || $forcedStatus === 'leave' || $forcedStatus === 'holiday' || $forcedStatus === 'weekend') {
            $status = $forcedStatus === 'leave' ? 'leave' : $forcedStatus;
            $otRate = $this->overtimeHourlyRate($employee, null, $hourly);
            $fridayRate = $this->fridayHourlyRate($employee, null, $hourly);

            return new AttendanceCalculationResult(
                workedMinutes: 0,
                overtimeMinutes: 0,
                fridayOvertimeMinutes: 0,
                lateMinutes: 0,
                earlyLeaveMinutes: 0,
                attendanceStatus: $status,
                hourlyRate: $hourly,
                overtimeHourlyRate: $otRate,
                fridayHourlyRate: $fridayRate,
                regularPay: 0,
                overtimePay: 0,
                fridayOvertimePay: 0,
                totalPay: 0,
            );
        }

        if ($forcedStatus === 'paid_leave') {
            $officialMinutes = AttendanceDefaults::defaultDailyWorkMinutes();
            $regularPay = round(($officialMinutes / 60) * $hourly, 2);
            $otRate = $this->overtimeHourlyRate($employee, null, $hourly);
            $fridayRate = $this->fridayHourlyRate($employee, null, $hourly);

            return new AttendanceCalculationResult(
                workedMinutes: $officialMinutes,
                overtimeMinutes: 0,
                fridayOvertimeMinutes: 0,
                lateMinutes: 0,
                earlyLeaveMinutes: 0,
                attendanceStatus: 'paid_leave',
                hourlyRate: $hourly,
                overtimeHourlyRate: $otRate,
                fridayHourlyRate: $fridayRate,
                regularPay: $regularPay,
                overtimePay: 0,
                fridayOvertimePay: 0,
                totalPay: $regularPay,
            );
        }

        $shift ??= $this->resolveShift->resolve($employee, $attendanceDate);
        $otRate = $this->overtimeHourlyRate($employee, $shift, $hourly);
        $fridayRate = $this->fridayHourlyRate($employee, $shift, $hourly);

        $officialMinutes = $shift ? $this->officialShiftMinutes($shift) : AttendanceDefaults::defaultDailyWorkMinutes();
        $breakMinutes = $shift ? (int) $shift->break_minutes : 0;

        $workedMinutes = 0;
        $lateMinutes = 0;
        $earlyLeaveMinutes = 0;

        if ($checkIn && $checkOut) {
            $workedMinutes = max(0, $checkIn->diffInMinutes($checkOut) - $breakMinutes);
            if ($shift) {
                $shiftStart = $this->shiftDateTime($attendanceDate, $shift->starts_at);
                $shiftEnd = $this->shiftDateTime($attendanceDate, $shift->ends_at);
                if ($shiftEnd->lessThanOrEqualTo($shiftStart)) {
                    $shiftEnd = $shiftEnd->copy()->addDay();
                }
                $lateMinutes = max(0, $checkIn->diffInMinutes($shiftStart, false) - self::LATE_GRACE_MINUTES);
                if ($lateMinutes < 0) {
                    $lateMinutes = 0;
                }
                $earlyLeaveMinutes = max(0, $shiftEnd->diffInMinutes($checkOut, false));
                if ($earlyLeaveMinutes < 0) {
                    $earlyLeaveMinutes = 0;
                }
            }
        }

        $overtimeMinutes = max(0, $workedMinutes - $officialMinutes);
        $fridayOvertimeMinutes = 0;

        if ($attendanceDate->isFriday() && $overtimeMinutes > 0) {
            $fridayOvertimeMinutes = $overtimeMinutes;
            $overtimeMinutes = 0;
        }

        $regularMinutes = min($workedMinutes, $officialMinutes);
        $regularPay = round(($regularMinutes / 60) * $hourly, 2);
        $overtimePay = round(($overtimeMinutes / 60) * $otRate, 2);
        $fridayOvertimePay = round(($fridayOvertimeMinutes / 60) * $fridayRate, 2);
        $totalPay = round($regularPay + $overtimePay + $fridayOvertimePay, 2);

        $status = $forcedStatus ?? $this->deriveStatus($lateMinutes, $workedMinutes);

        return new AttendanceCalculationResult(
            workedMinutes: $workedMinutes,
            overtimeMinutes: $overtimeMinutes,
            fridayOvertimeMinutes: $fridayOvertimeMinutes,
            lateMinutes: $lateMinutes,
            earlyLeaveMinutes: $earlyLeaveMinutes,
            attendanceStatus: $status,
            hourlyRate: $hourly,
            overtimeHourlyRate: $otRate,
            fridayHourlyRate: $fridayRate,
            regularPay: $regularPay,
            overtimePay: $overtimePay,
            fridayOvertimePay: $fridayOvertimePay,
            totalPay: $totalPay,
        );
    }

    private function deriveStatus(int $lateMinutes, int $workedMinutes): string
    {
        if ($workedMinutes <= 0) {
            return 'absent';
        }
        if ($lateMinutes > 0) {
            return 'late';
        }

        return 'present';
    }

    private function officialShiftMinutes(Shift $shift): int
    {
        $start = Carbon::parse($shift->starts_at);
        $end = Carbon::parse($shift->ends_at);
        $minutes = $start->diffInMinutes($end);
        if ($minutes <= 0) {
            $minutes = $start->diffInMinutes($end->copy()->addDay());
        }

        return max(0, $minutes - (int) $shift->break_minutes);
    }

    private function shiftDateTime(CarbonInterface $date, mixed $time): Carbon
    {
        $t = Carbon::parse($time);

        return Carbon::parse($date->toDateString().' '.$t->format('H:i:s'));
    }

    private function hourlyRate(Employee $employee): float
    {
        return AttendanceDefaults::hourlyRateFromMonthlySalary((float) $employee->basic_salary);
    }

    private function overtimeHourlyRate(Employee $employee, ?Shift $shift, float $hourly): float
    {
        $mult = $shift ? (float) $shift->overtime_multiplier : 1.5;

        return round($hourly * $mult, 4);
    }

    private function fridayHourlyRate(Employee $employee, ?Shift $shift, float $hourly): float
    {
        $mult = $shift ? (float) $shift->friday_multiplier : 2.0;

        return round($hourly * $mult, 4);
    }
}
