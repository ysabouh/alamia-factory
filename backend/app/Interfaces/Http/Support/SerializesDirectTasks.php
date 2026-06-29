<?php

namespace App\Interfaces\Http\Support;

use App\Domain\Factory\Enums\DirectTaskAssignmentType;
use App\Domain\Factory\Models\DirectTask;
use App\Domain\Factory\Models\DirectTaskAssignment;
use App\Domain\Factory\Models\DirectTaskAttachment;
use App\Domain\Factory\Models\DirectTaskChecklistItem;
use App\Domain\Factory\Models\DirectTaskChecklistTemplate;
use App\Domain\Factory\Models\DirectTaskComment;
use App\Domain\Factory\Models\DirectTaskDraft;
use App\Domain\Factory\Models\DirectTaskSchedule;
use App\Domain\Factory\Models\Employee;
use Illuminate\Support\Collection;

trait SerializesDirectTasks
{
    protected function serializeDirectTask(DirectTask $task): array
    {
        $task->loadMissing(['checklistItems', 'assignments', 'attachments', 'schedule', 'comments.user', 'creator']);

        $checklist = $task->checklistItems;
        $completed = $checklist->where('is_completed', true)->count();
        $total = $checklist->count();

        $employeeAvatars = $this->employeeAvatarsForAssignments($task->assignments);

        return [
            'id' => $task->id,
            'taskNumber' => $task->task_number,
            'scheduleId' => $task->schedule_id,
            'title' => $task->title,
            'description' => $task->description,
            'category' => $task->category?->value ?? $task->category,
            'priority' => $task->priority?->value ?? $task->priority,
            'taskType' => $task->task_type?->value ?? $task->task_type,
            'status' => $task->status?->value ?? $task->status,
            'startDate' => $task->start_date?->format('Y-m-d'),
            'executionTime' => $task->execution_time,
            'dueAt' => $task->due_at?->toIso8601String(),
            'expectedDurationMinutes' => $task->expected_duration_minutes,
            'reminderAt' => $task->reminder_at?->toIso8601String(),
            'options' => $task->options ?? [],
            'notes' => $task->notes,
            'startedAt' => $task->started_at?->toIso8601String(),
            'completedAt' => $task->completed_at?->toIso8601String(),
            'isOverdue' => (bool) $task->is_overdue,
            'progressPercent' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            'checklistCompleted' => $completed,
            'checklistTotal' => $total,
            'checklist' => $checklist->map(fn ($i) => $this->serializeChecklistItem($i))->values()->all(),
            'assignments' => $task->assignments->map(fn ($a) => $this->serializeAssignment($a, $employeeAvatars))->values()->all(),
            'attachments' => $task->attachments->map(fn ($a) => $this->serializeAttachment($a))->values()->all(),
            'schedule' => $task->schedule ? $this->serializeSchedule($task->schedule) : null,
            'comments' => $task->comments->map(fn ($c) => $this->serializeComment($c))->values()->all(),
            'createdByName' => $task->creator?->name,
            'rejectionReason' => ($task->options ?? [])['rejectionReason'] ?? null,
            'createdAt' => $task->created_at?->toIso8601String(),
            'updatedAt' => $task->updated_at?->toIso8601String(),
        ];
    }

    protected function serializeComment(DirectTaskComment $comment): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'commentType' => $comment->comment_type ?? 'comment',
            'userId' => $comment->user_id,
            'userName' => $comment->user?->name,
            'createdAt' => $comment->created_at?->toIso8601String(),
        ];
    }

    protected function serializeSchedule(DirectTaskSchedule $schedule): array
    {
        return [
            'id' => $schedule->id,
            'scheduleNumber' => $schedule->schedule_number,
            'taskType' => $schedule->task_type?->value ?? $schedule->task_type,
            'nextRunAt' => $schedule->next_run_at?->toIso8601String(),
            'lastRunAt' => $schedule->last_run_at?->toIso8601String(),
            'isActive' => (bool) $schedule->is_active,
        ];
    }

    protected function serializeChecklistItem(DirectTaskChecklistItem $item): array
    {
        return [
            'id' => $item->id,
            'label' => $item->label,
            'itemType' => $item->item_type?->value ?? $item->item_type,
            'isRequired' => (bool) $item->is_required,
            'sortOrder' => $item->sort_order,
            'isCompleted' => (bool) $item->is_completed,
            'responseValue' => $item->response_value,
        ];
    }

    protected function serializeAssignment(DirectTaskAssignment $assignment, ?Collection $employeeAvatars = null): array
    {
        $type = $assignment->assignment_type?->value ?? $assignment->assignment_type;
        $avatarUrl = null;
        if ($type === DirectTaskAssignmentType::Employee->value) {
            $avatarUrl = $employeeAvatars?->get($assignment->assignee_id);
        }

        return [
            'id' => $assignment->id,
            'type' => $type,
            'assigneeId' => $assignment->assignee_id,
            'label' => $assignment->assignee_label,
            'avatarUrl' => $avatarUrl,
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, DirectTaskAssignment>  $assignments
     * @return Collection<int, string|null>
     */
    protected function employeeAvatarsForAssignments(Collection $assignments): Collection
    {
        $employeeIds = $assignments
            ->filter(fn (DirectTaskAssignment $a) => ($a->assignment_type?->value ?? $a->assignment_type) === DirectTaskAssignmentType::Employee->value)
            ->pluck('assignee_id')
            ->unique()
            ->values();

        if ($employeeIds->isEmpty()) {
            return collect();
        }

        return Employee::query()
            ->whereIn('id', $employeeIds)
            ->pluck('profile_image', 'id');
    }

    protected function serializeAttachment(DirectTaskAttachment $attachment): array
    {
        return [
            'id' => $attachment->id,
            'fileName' => $attachment->file_name,
            'filePath' => $attachment->file_path,
            'mimeType' => $attachment->mime_type,
            'fileSize' => $attachment->file_size,
        ];
    }

    protected function serializeChecklistTemplate(DirectTaskChecklistTemplate $template): array
    {
        $template->loadMissing('items');

        return [
            'id' => $template->id,
            'code' => $template->code,
            'name' => $template->name,
            'description' => $template->description,
            'items' => $template->items->map(fn ($i) => [
                'id' => $i->id,
                'label' => $i->label,
                'itemType' => $i->item_type?->value ?? $i->item_type,
                'isRequired' => (bool) $i->is_required,
                'sortOrder' => $i->sort_order,
            ])->values()->all(),
        ];
    }

    protected function serializeDraft(?DirectTaskDraft $draft): ?array
    {
        if ($draft === null) {
            return null;
        }

        return [
            'payload' => $draft->payload,
            'updatedAt' => $draft->updated_at?->toIso8601String(),
        ];
    }
}
