<?php

namespace App\Application\DirectTasks;

use App\Domain\Factory\Enums\DirectTaskType;
use App\Domain\Factory\Models\DirectTaskSchedule;
use Carbon\Carbon;

class DirectTaskScheduleCalculator
{
    public function computeNextRunAt(DirectTaskSchedule $schedule, ?Carbon $after = null): ?Carbon
    {
        $type = $schedule->task_type;
        if (! $type instanceof DirectTaskType) {
            $type = DirectTaskType::tryFrom((string) $schedule->task_type);
        }

        if ($type === null || ! $type->isRecurring()) {
            return null;
        }

        $base = $after ?? now();
        $time = $schedule->execution_time ? Carbon::parse($schedule->execution_time)->format('H:i:s') : '08:00:00';
        $start = $schedule->start_date
            ? Carbon::parse($schedule->start_date->format('Y-m-d').' '.$time)
            : Carbon::parse($base->format('Y-m-d').' '.$time);

        if ($start->greaterThan($base) && $after === null) {
            return $start;
        }

        return match ($type) {
            DirectTaskType::Daily => $this->nextDaily($start, $base, max(1, (int) $schedule->repeat_every)),
            DirectTaskType::Weekly => $this->nextWeekly($start, $base, $schedule->weekdays ?? [], max(1, (int) $schedule->repeat_every)),
            DirectTaskType::Monthly => $this->nextMonthly($start, $base, (int) ($schedule->month_day ?? $start->day), max(1, (int) $schedule->repeat_every)),
            default => null,
        };
    }

    private function nextDaily(Carbon $start, Carbon $after, int $every): Carbon
    {
        $candidate = $start->copy();
        while ($candidate->lessThanOrEqualTo($after)) {
            $candidate->addDays($every);
        }

        return $candidate;
    }

    private function nextWeekly(Carbon $start, Carbon $after, array $weekdays, int $every): Carbon
    {
        $days = array_map('intval', $weekdays);
        if ($days === []) {
            $days = [(int) $start->dayOfWeek];
        }

        $candidate = $after->copy()->addDay()->startOfDay();
        for ($i = 0; $i < 366; $i++) {
            $time = $start->format('H:i:s');
            $slot = Carbon::parse($candidate->format('Y-m-d').' '.$time);
            if ($slot->greaterThan($after) && in_array($slot->dayOfWeek, $days, true)) {
                $weeksSinceStart = (int) $start->startOfWeek()->diffInWeeks($slot->copy()->startOfWeek());
                if ($weeksSinceStart % $every === 0) {
                    return $slot;
                }
            }
            $candidate->addDay();
        }

        return $start->copy()->addWeeks($every);
    }

    private function nextMonthly(Carbon $start, Carbon $after, int $monthDay, int $every): Carbon
    {
        $day = max(1, min(28, $monthDay));
        $candidate = $after->copy()->startOfMonth();
        for ($i = 0; $i < 24; $i++) {
            $time = $start->format('H:i:s');
            $slot = Carbon::parse($candidate->format('Y-m').'-'.str_pad((string) $day, 2, '0', STR_PAD_LEFT).' '.$time);
            if ($slot->greaterThan($after)) {
                $monthsSince = $start->diffInMonths($slot);
                if ($monthsSince % $every === 0) {
                    return $slot;
                }
            }
            $candidate->addMonth();
        }

        return $start->copy()->addMonths($every);
    }
}
