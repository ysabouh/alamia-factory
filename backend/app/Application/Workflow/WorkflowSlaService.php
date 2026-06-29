<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Enums\WorkflowInstanceStatus;
use App\Domain\Factory\Enums\WorkflowTaskStatus;
use App\Domain\Factory\Enums\WorkflowTimelineAction;
use App\Domain\Factory\Models\WorkflowInstance;
use App\Domain\Factory\Models\Alert;
use App\Domain\Factory\Models\WorkflowTask;
use Carbon\Carbon;

class WorkflowSlaService
{
    public function __construct(
        private readonly WorkflowNotificationService $notifications,
        private readonly WorkflowTimelineService $timeline,
    ) {}

    public function checkOverdue(): int
    {
        $count = 0;
        $now = now();

        WorkflowTask::query()
            ->where('is_overdue', false)
            ->whereNotIn('status', [
                WorkflowTaskStatus::Completed->value,
                WorkflowTaskStatus::Cancelled->value,
                WorkflowTaskStatus::Rejected->value,
            ])
            ->whereNotNull('due_at')
            ->where('due_at', '<', $now)
            ->with('instance')
            ->chunkById(100, function ($tasks) use (&$count): void {
                foreach ($tasks as $task) {
                    $this->markTaskOverdue($task);
                    $count++;
                }
            });

        return $count;
    }

    private function markTaskOverdue(WorkflowTask $task): void
    {
        $task->update([
            'is_overdue' => true,
            'status' => WorkflowTaskStatus::Overdue,
        ]);

        Alert::query()->create([
            'alertable_type' => $task->getMorphClass(),
            'alertable_id' => $task->id,
            'severity' => 'warning',
            'message' => 'تجاوزت المهمة '.$task->task_number.' وقت SLA.',
        ]);

        $instance = $task->instance;
        if ($instance && $instance->status !== WorkflowInstanceStatus::Overdue) {
            $instance->update(['status' => WorkflowInstanceStatus::Overdue]);
            $this->timeline->record($instance, WorkflowTimelineAction::Overdue, $task->id, 'تجاوز SLA');
            $this->notifications->notifySupervisor(
                $instance,
                'تجاوزت المهمة '.$task->task_number.' وقت SLA المحدد.',
            );
        }
    }
}
