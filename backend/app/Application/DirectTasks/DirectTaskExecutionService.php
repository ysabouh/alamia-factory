<?php

namespace App\Application\DirectTasks;

use App\Domain\Factory\Enums\DirectTaskStatus;
use App\Domain\Factory\Models\DirectTask;
use App\Domain\Factory\Models\DirectTaskChecklistItem;
use App\Domain\Factory\Models\DirectTaskComment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class DirectTaskExecutionService
{
    public function start(DirectTask $task): DirectTask
    {
        $this->assertExecutable($task);

        if (in_array($task->status, [DirectTaskStatus::Assigned, DirectTaskStatus::Accepted, DirectTaskStatus::Pending], true)) {
            $task->status = DirectTaskStatus::InProgress;
            $task->started_at = $task->started_at ?? now();
            $task->save();
        }

        return $task->fresh(['checklistItems', 'assignments', 'attachments', 'comments.user']);
    }

    public function pause(DirectTask $task): DirectTask
    {
        $this->assertExecutable($task);

        if ($task->status === DirectTaskStatus::InProgress) {
            $task->status = DirectTaskStatus::Accepted;
            $task->save();
        }

        return $task->fresh(['checklistItems', 'assignments', 'attachments', 'comments.user']);
    }

    public function submitForReview(DirectTask $task): DirectTask
    {
        $this->assertExecutable($task);
        $this->assertRequiredChecklistComplete($task);

        $task->status = DirectTaskStatus::WaitingReview;
        $task->save();

        return $task->fresh(['checklistItems', 'assignments', 'attachments', 'comments.user']);
    }

    public function complete(DirectTask $task): DirectTask
    {
        $this->assertExecutable($task);
        $this->assertRequiredChecklistComplete($task);

        $options = $task->options ?? [];
        $needsReview = ! empty($options['requireManagerApproval']) || ! empty($options['requireSupervisorApproval']);

        if ($needsReview && $task->status !== DirectTaskStatus::WaitingReview) {
            $task->status = DirectTaskStatus::WaitingReview;
        } else {
            $task->status = DirectTaskStatus::Completed;
            $task->completed_at = now();
        }

        $task->save();

        return $task->fresh(['checklistItems', 'assignments', 'attachments', 'comments.user']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateChecklistItem(DirectTask $task, DirectTaskChecklistItem $item, array $data): DirectTask
    {
        $this->assertExecutable($task);

        if ($item->task_id !== $task->id) {
            throw ValidationException::withMessages(['item' => ['البند لا ينتمي لهذه المهمة.']]);
        }

        if (array_key_exists('isCompleted', $data)) {
            $item->is_completed = (bool) $data['isCompleted'];
        }
        if (array_key_exists('responseValue', $data)) {
            $item->response_value = $data['responseValue'];
        }
        $item->save();

        if ($task->status === DirectTaskStatus::Assigned) {
            $task->status = DirectTaskStatus::InProgress;
            $task->started_at = $task->started_at ?? now();
            $task->save();
        }

        return $task->fresh(['checklistItems', 'assignments', 'attachments', 'comments.user']);
    }

    public function addComment(DirectTask $task, string $body, string $commentType = 'comment'): DirectTaskComment
    {
        $user = Auth::user();
        if ($user === null) {
            throw ValidationException::withMessages(['auth' => ['يجب تسجيل الدخول.']]);
        }

        $type = in_array($commentType, ['comment', 'problem', 'help'], true) ? $commentType : 'comment';

        return DirectTaskComment::query()->create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'body' => trim($body),
            'comment_type' => $type,
        ])->load('user');
    }

    private function assertExecutable(DirectTask $task): void
    {
        if (in_array($task->status, [DirectTaskStatus::Completed, DirectTaskStatus::Cancelled], true)) {
            throw ValidationException::withMessages(['status' => ['لا يمكن تنفيذ مهمة منتهية أو ملغاة.']]);
        }
    }

    private function assertRequiredChecklistComplete(DirectTask $task): void
    {
        $options = $task->options ?? [];
        if (! ($options['preventCloseBeforeChecklist'] ?? false)) {
            return;
        }

        $pending = $task->checklistItems()
            ->where('is_required', true)
            ->where('is_completed', false)
            ->exists();

        if ($pending) {
            throw ValidationException::withMessages(['checklist' => ['أكمل جميع البنود الإلزامية قبل الإغلاق.']]);
        }
    }
}
