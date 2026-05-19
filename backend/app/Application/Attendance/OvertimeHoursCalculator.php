<?php

namespace App\Application\Attendance;

use Carbon\Carbon;
use Carbon\CarbonInterface;

class OvertimeHoursCalculator
{
    public function weekdayMultiplier(): float
    {
        return (float) config('factory.overtime.weekday_multiplier', 1.5);
    }

    public function fridayMultiplier(): float
    {
        return (float) config('factory.overtime.friday_multiplier', 2.0);
    }

    public function multiplierForDate(CarbonInterface|string $date): float
    {
        $d = $date instanceof CarbonInterface ? Carbon::instance($date) : Carbon::parse($date);

        return $d->isFriday() ? $this->fridayMultiplier() : $this->weekdayMultiplier();
    }

    public function multiplierLabelForDate(CarbonInterface|string $date): string
    {
        $mult = $this->multiplierForDate($date);

        return $this->multiplierLabel($mult);
    }

    public function multiplierLabel(float $multiplier): string
    {
        if (abs($multiplier - $this->fridayMultiplier()) < 0.001) {
            return 'ضعف (×'.rtrim(rtrim(number_format($multiplier, 2, '.', ''), '0'), '.').')';
        }

        return 'ضعف ونصف (×'.rtrim(rtrim(number_format($multiplier, 2, '.', ''), '0'), '.').')';
    }

    /**
     * @return array{
     *   durationHours: float,
     *   weightedHours: float,
     *   rateMultiplier: float,
     *   multiplierLabel: string,
     *   isFriday: bool
     * }
     */
    public function compute(string $overtimeDate, string $startTime, string $endTime): array
    {
        [$start, $end] = $this->parseWindow($overtimeDate, $startTime, $endTime);
        $durationHours = round(max(0, $start->diffInMinutes($end) / 60), 2);
        $rateMultiplier = $this->multiplierForDate($overtimeDate);
        $weightedHours = round($durationHours * $rateMultiplier, 2);

        return [
            'durationHours' => $durationHours,
            'weightedHours' => $weightedHours,
            'rateMultiplier' => $rateMultiplier,
            'multiplierLabel' => $this->multiplierLabel($rateMultiplier),
            'isFriday' => Carbon::parse($overtimeDate)->isFriday(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function policyForApi(): array
    {
        $weekday = $this->weekdayMultiplier();
        $friday = $this->fridayMultiplier();

        return [
            'weekdayMultiplier' => $weekday,
            'fridayMultiplier' => $friday,
            'weekdayLabel' => $this->multiplierLabel($weekday),
            'fridayLabel' => $this->multiplierLabel($friday),
        ];
    }

    /** ساعات 0–24، دقائق 0–60 */
    public function normalizeTimeInput(string $time): string
    {
        if (! preg_match('/^(\d{1,2}):(\d{1,2})/', trim($time), $m)) {
            return '00:00';
        }

        $hour = min(24, max(0, (int) $m[1]));
        $minute = min(60, max(0, (int) $m[2]));

        if ($minute === 60) {
            $hour = min(24, $hour + 1);
            $minute = 0;
        }
        if ($hour === 24) {
            $minute = 0;
        }

        return sprintf('%02d:%02d', $hour, $minute);
    }

    private function timeOnDate(string $date, string $time): Carbon
    {
        $normalized = $this->normalizeTimeInput($time);
        if (str_starts_with($normalized, '24:')) {
            return Carbon::parse($date.' 00:00:00')->addDay();
        }

        return Carbon::parse($date.' '.$normalized);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    public function parseWindow(string $date, string $startTime, string $endTime): array
    {
        $start = $this->timeOnDate($date, $startTime);
        $end = $this->timeOnDate($date, $endTime);
        if ($end->lessThanOrEqualTo($start)) {
            $end = $end->copy()->addDay();
        }

        return [$start, $end];
    }
}
