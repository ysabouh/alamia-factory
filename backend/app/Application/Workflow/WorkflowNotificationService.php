<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Models\Alert;
use App\Domain\Factory\Models\User;
use App\Domain\Factory\Models\WorkflowInstance;
use App\Domain\Factory\Models\WorkflowNotification;
use App\Domain\Factory\Models\WorkflowTask;
use Illuminate\Support\Facades\Auth;

class WorkflowNotificationService
{
    public function notifyTaskAssigned(WorkflowTask $task): void
    {
        if (! $task->assigned_to) {
            return;
        }

        $user = User::query()->where('employee_id', $task->assigned_to)->first();
        if (! $user) {
            return;
        }

        $instance = $task->instance;
        $title = 'مهمة جديدة: '.$task->task_number;
        $message = 'تم تعيين مهمة في سير العمل '.$instance->workflow_number;

        WorkflowNotification::query()->create([
            'user_id' => $user->id,
            'instance_id' => $instance->id,
            'task_id' => $task->id,
            'type' => 'task_assigned',
            'title' => $title,
            'message' => $message,
        ]);

        Alert::query()->create([
            'alertable_type' => $task->getMorphClass(),
            'alertable_id' => $task->id,
            'severity' => 'info',
            'message' => $message,
        ]);
    }

    public function notifySupervisor(WorkflowInstance $instance, string $message, string $severity = 'warning'): void
    {
        $stage = $instance->currentStage;
        if (! $stage) {
            return;
        }

        $config = $stage->assignment_config ?? [];
        $departmentId = $config['departmentId'] ?? null;
        if ($departmentId) {
            $manager = \App\Domain\Factory\Models\Department::query()->find($departmentId)?->manager;
            if ($manager) {
                $user = User::query()->where('employee_id', $manager->id)->first();
                if ($user) {
                    WorkflowNotification::query()->create([
                        'user_id' => $user->id,
                        'instance_id' => $instance->id,
                        'type' => 'sla_escalation',
                        'title' => 'تصعيد SLA',
                        'message' => $message,
                    ]);
                }
            }
        }

        Alert::query()->create([
            'alertable_type' => $instance->getMorphClass(),
            'alertable_id' => $instance->id,
            'severity' => $severity,
            'message' => $message,
        ]);
    }

    public function markRead(int $notificationId): void
    {
        WorkflowNotification::query()
            ->where('id', $notificationId)
            ->where('user_id', Auth::id())
            ->update(['read_at' => now()]);
    }
}
