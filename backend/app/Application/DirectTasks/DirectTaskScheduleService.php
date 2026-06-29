<?php

namespace App\Application\DirectTasks;

use App\Domain\Factory\Enums\DirectTaskType;
use App\Domain\Factory\Models\DirectTask;
use App\Domain\Factory\Models\DirectTaskSchedule;
use Illuminate\Support\Facades\DB;

class DirectTaskScheduleService
{
    public function __construct(
        private readonly DirectTaskNumberGenerator $numbers,
        private readonly DirectTaskScheduleCalculator $calculator,
        private readonly DirectTaskService $tasks,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function createWithFirstTask(array $data): DirectTask
    {
        return DB::transaction(function () use ($data): DirectTask {
            $taskType = DirectTaskType::from($data['taskType']);
            $scheduling = $data['scheduling'] ?? [];

            $schedule = DirectTaskSchedule::query()->create([
                'schedule_number' => $this->numbers->nextScheduleNumber(),
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'category' => $data['category'],
                'priority' => $data['priority'] ?? 'normal',
                'task_type' => $taskType->value,
                'start_date' => $scheduling['startDate'] ?? now()->toDateString(),
                'execution_time' => $scheduling['executionTime'] ?? '08:00:00',
                'expected_duration_minutes' => $scheduling['expectedDurationMinutes'] ?? null,
                'reminder_minutes_before' => $scheduling['reminderMinutesBefore'] ?? null,
                'repeat_every' => max(1, (int) ($scheduling['repeatEvery'] ?? 1)),
                'weekdays' => $scheduling['weekdays'] ?? null,
                'month_day' => $scheduling['monthDay'] ?? null,
                'options' => $data['options'] ?? [],
                'notes' => $data['notes'] ?? null,
                'is_active' => true,
            ]);

            $schedule->next_run_at = $this->calculator->computeNextRunAt($schedule);
            $schedule->save();

            $this->tasks->syncChecklist($schedule, $data['checklist'] ?? [], true);
            $this->tasks->syncAssignments($schedule, $data['assignments'] ?? [], true);

            $schedule->load(['checklistItems', 'assignments']);
            $task = $this->tasks->createTaskRecord($data, $taskType, $schedule);
            $this->tasks->copyScheduleRelationsToTask($schedule, $task);

            $schedule->last_run_at = now();
            $schedule->next_run_at = $this->calculator->computeNextRunAt($schedule, now());
            $schedule->save();

            return $task->load(['checklistItems', 'assignments', 'attachments', 'schedule']);
        });
    }
}
