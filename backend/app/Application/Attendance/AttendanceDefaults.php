<?php

namespace App\Application\Attendance;

use Carbon\Carbon;

/**
 * قيم افتراضية للحضور من config/factory.php — أوقات الدخول/الخروج وساعات اليوم.
 */
final class AttendanceDefaults
{
    public static function defaultDailyWorkMinutes(): int
    {
        $explicit = config('factory.attendance.default_daily_work_minutes');
        if ($explicit !== null && $explicit !== '' && (int) $explicit > 0) {
            return (int) $explicit;
        }

        return self::minutesBetween(
            (string) config('factory.attendance.default_check_in', '08:00'),
            (string) config('factory.attendance.default_check_out', '19:00'),
        );
    }

    public static function defaultDailyWorkHours(): float
    {
        return round(self::defaultDailyWorkMinutes() / 60, 4);
    }

    public static function payrollWorkDaysPerWeek(): int
    {
        return max(1, (int) config('factory.payroll.work_days_per_week', 6));
    }

    /**
     * ثمن الساعة = الراتب الشهري ÷ أيام العمل في الأسبوع ÷ ساعات اليوم.
     * ساعات اليوم = فرق default_check_out − default_check_in (أو default_daily_work_minutes إن وُجد).
     */
    public static function hourlyRateFromMonthlySalary(float $monthlySalary): float
    {
        if ($monthlySalary <= 0) {
            return 0.01;
        }

        $hoursPerDay = self::defaultDailyWorkHours();
        $divisor = self::payrollWorkDaysPerWeek() * $hoursPerDay;
        if ($divisor <= 0) {
            return 0.01;
        }

        return round($monthlySalary / $divisor, 4);
    }

    /**
     * @return array{workDaysPerWeek:int,dailyWorkHours:float,dailyWorkMinutes:int,checkIn:string,checkOut:string,weekdayOvertimeMultiplier:float,fridayOvertimeMultiplier:float}
     */
    public static function payrollHourlyRateMeta(): array
    {
        return [
            'workDaysPerWeek' => self::payrollWorkDaysPerWeek(),
            'dailyWorkHours' => self::defaultDailyWorkHours(),
            'dailyWorkMinutes' => self::defaultDailyWorkMinutes(),
            'checkIn' => (string) config('factory.attendance.default_check_in', '08:00'),
            'checkOut' => (string) config('factory.attendance.default_check_out', '19:00'),
            'weekdayOvertimeMultiplier' => (float) config('factory.overtime.weekday_multiplier', 1.5),
            'fridayOvertimeMultiplier' => (float) config('factory.overtime.friday_multiplier', 2.0),
        ];
    }

    public static function proratedBasicSalaryForPeriod(float $monthlySalary, \Carbon\CarbonInterface $from, \Carbon\CarbonInterface $to): float
    {
        if ($monthlySalary <= 0) {
            return 0.0;
        }

        $periodDays = $from->copy()->startOfDay()->diffInDays($to->copy()->startOfDay()) + 1;
        $daysInMonth = max(1, $from->daysInMonth);

        return round($monthlySalary * ($periodDays / $daysInMonth), 2);
    }

    public static function minutesBetween(string $from, string $to): int
    {
        $start = Carbon::parse('2000-01-01 '.self::normalizeTime($from));
        $end = Carbon::parse('2000-01-01 '.self::normalizeTime($to));
        $minutes = $start->diffInMinutes($end);
        if ($minutes <= 0) {
            $minutes = $start->diffInMinutes($end->copy()->addDay());
        }

        return max(0, $minutes);
    }

    private static function normalizeTime(string $time): string
    {
        $time = trim($time);
        if (preg_match('/^\d{1,2}:\d{2}$/', $time)) {
            return $time.':00';
        }

        return $time;
    }
}
