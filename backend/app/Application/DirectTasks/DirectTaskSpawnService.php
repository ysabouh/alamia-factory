<?php

namespace App\Application\DirectTasks;

use App\Domain\Factory\Models\DirectTaskSchedule;
use Illuminate\Support\Facades\DB;

class DirectTaskSpawnService
{
    public function __construct(
        private readonly DirectTaskScheduleCalculator $calculator,
        private readonly DirectTaskService $tasks,
    ) {}

    public function spawnDue(): int
    {
        $count = 0;
        $due = DirectTaskSchedule::query()
            ->where('is_active', true)
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', now())
            ->get();

        foreach ($due as $schedule) {
            $schedule->load(['checklistItems', 'assignments']);
            DB::transaction(function () use ($schedule, &$count): void {
                $data = [
                    'title' => $schedule->title,
                    'description' => $schedule->description,
                    'category' => $schedule->category?->value ?? $schedule->category,
                    'priority' => $schedule->priority?->value ?? $schedule->priority,
                    'taskType' => $schedule->task_type?->value ?? $schedule->task_type,
                    'scheduling' => [
                        'startDate' => $schedule->start_date?->format('Y-m-d'),
                        'executionTime' => $schedule->execution_time,
                        'expectedDurationMinutes' => $schedule->expected_duration_minutes,
                        'reminderMinutesBefore' => $schedule->reminder_minutes_before,
                    ],
                    'options' => $schedule->options ?? [],
                    'notes' => $schedule->notes,
                ];

                $taskType = $schedule->task_type;
                $task = $this->tasks->createTaskRecord($data, $taskType, $schedule);
                $this->tasks->copyScheduleRelationsToTask($schedule, $task);

                $schedule->last_run_at = now();
                $schedule->next_run_at = $this->calculator->computeNextRunAt($schedule, now());
                $schedule->save();

                $count++;
            });
        }

        return $count;
    }
}
