<?php

namespace App\Application\DirectTasks;

use App\Domain\Factory\Models\DirectTask;
use App\Domain\Factory\Models\DirectTaskSchedule;

class DirectTaskNumberGenerator
{
    public function nextTaskNumber(): string
    {
        return $this->nextNumber('DT', DirectTask::class, 'task_number');
    }

    public function nextScheduleNumber(): string
    {
        return $this->nextNumber('DS', DirectTaskSchedule::class, 'schedule_number');
    }

    private function nextNumber(string $prefix, string $modelClass, string $column): string
    {
        $year = now()->format('Y');
        $fullPrefix = "{$prefix}-{$year}-";

        $last = $modelClass::query()
            ->where($column, 'like', $fullPrefix.'%')
            ->orderByDesc($column)
            ->value($column);

        $seq = 1;
        if (is_string($last) && preg_match('/-(\d+)$/', $last, $m)) {
            $seq = (int) $m[1] + 1;
        }

        return $fullPrefix.str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }
}
