<?php

namespace App\Application\DirectTasks;

use App\Domain\Factory\Enums\DirectTaskAssignmentType;
use App\Domain\Factory\Enums\DirectTaskChecklistItemType;
use App\Domain\Factory\Enums\DirectTaskStatus;
use App\Domain\Factory\Enums\DirectTaskType;
use App\Domain\Factory\Models\DirectTask;
use App\Domain\Factory\Models\DirectTaskAssignment;
use App\Domain\Factory\Models\DirectTaskAttachment;
use App\Domain\Factory\Models\DirectTaskChecklistItem;
use App\Domain\Factory\Models\DirectTaskSchedule;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class DirectTaskService
{
    public function __construct(
        private readonly DirectTaskNumberGenerator $numbers,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function createOneTime(array $data): DirectTask
    {
        $taskType = DirectTaskType::from($data['taskType']);

        return DB::transaction(function () use ($data, $taskType): DirectTask {
            $task = $this->createTaskRecord($data, $taskType, null);
            $this->syncChecklist($task, $data['checklist'] ?? [], false);
            $this->syncAssignments($task, $data['assignments'] ?? [], false);

            return $task->load(['checklistItems', 'assignments', 'attachments']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function createTaskRecord(array $data, DirectTaskType $taskType, ?DirectTaskSchedule $schedule): DirectTask
    {
        $scheduling = $data['scheduling'] ?? [];
        $dueAt = isset($scheduling['dueAt']) ? Carbon::parse($scheduling['dueAt']) : null;
        $reminderAt = null;
        if ($dueAt && ! empty($scheduling['reminderMinutesBefore'])) {
            $reminderAt = $dueAt->copy()->subMinutes((int) $scheduling['reminderMinutesBefore']);
        }

        $status = ($data['saveAsDraft'] ?? false)
            ? DirectTaskStatus::Draft
            : DirectTaskStatus::Assigned;

        return DirectTask::query()->create([
            'task_number' => $this->numbers->nextTaskNumber(),
            'schedule_id' => $schedule?->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'],
            'priority' => $data['priority'] ?? 'normal',
            'task_type' => $taskType->value,
            'status' => $status,
            'start_date' => $scheduling['startDate'] ?? null,
            'execution_time' => $scheduling['executionTime'] ?? null,
            'due_at' => $dueAt,
            'expected_duration_minutes' => $scheduling['expectedDurationMinutes'] ?? null,
            'reminder_at' => $reminderAt,
            'options' => $data['options'] ?? [],
            'notes' => $data['notes'] ?? null,
            'started_at' => $status === DirectTaskStatus::Assigned ? now() : null,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    public function syncChecklist(DirectTask|DirectTaskSchedule $owner, array $items, bool $forSchedule): void
    {
        $foreignKey = $forSchedule ? 'schedule_id' : 'task_id';
        $ownerId = $owner->id;

        DirectTaskChecklistItem::query()->where($foreignKey, $ownerId)->delete();

        foreach (array_values($items) as $index => $item) {
            DirectTaskChecklistItem::query()->create([
                $foreignKey => $ownerId,
                'label' => $item['label'],
                'item_type' => $item['itemType'] ?? DirectTaskChecklistItemType::Checkbox->value,
                'is_required' => (bool) ($item['isRequired'] ?? false),
                'sort_order' => (int) ($item['sortOrder'] ?? $index),
            ]);
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $assignments
     */
    public function syncAssignments(DirectTask|DirectTaskSchedule $owner, array $assignments, bool $forSchedule): void
    {
        $foreignKey = $forSchedule ? 'schedule_id' : 'task_id';
        $ownerId = $owner->id;

        DirectTaskAssignment::query()->where($foreignKey, $ownerId)->delete();

        foreach ($assignments as $row) {
            DirectTaskAssignment::query()->create([
                $foreignKey => $ownerId,
                'assignment_type' => $row['type'] ?? DirectTaskAssignmentType::Employee->value,
                'assignee_id' => (int) $row['assigneeId'],
                'assignee_label' => $row['label'] ?? null,
            ]);
        }
    }

    public function copyScheduleRelationsToTask(DirectTaskSchedule $schedule, DirectTask $task): void
    {
        foreach ($schedule->checklistItems as $item) {
            DirectTaskChecklistItem::query()->create([
                'task_id' => $task->id,
                'label' => $item->label,
                'item_type' => $item->item_type,
                'is_required' => $item->is_required,
                'sort_order' => $item->sort_order,
            ]);
        }

        foreach ($schedule->assignments as $assignment) {
            DirectTaskAssignment::query()->create([
                'task_id' => $task->id,
                'assignment_type' => $assignment->assignment_type,
                'assignee_id' => $assignment->assignee_id,
                'assignee_label' => $assignment->assignee_label,
            ]);
        }
    }

    public function storeAttachment(DirectTask $task, UploadedFile $file): DirectTaskAttachment
    {
        $max = (int) config('direct-tasks.max_attachment_bytes', 10485760);
        if ($file->getSize() > $max) {
            throw ValidationException::withMessages(['file' => ['حجم الملف يتجاوز الحد المسموح.']]);
        }

        $mime = $file->getMimeType() ?? 'application/octet-stream';
        $allowed = config('direct-tasks.allowed_mime_types', []);
        if ($allowed && ! in_array($mime, $allowed, true)) {
            throw ValidationException::withMessages(['file' => ['نوع الملف غير مدعوم.']]);
        }

        $disk = config('direct-tasks.storage_disk', 'public');
        $path = $file->store(config('direct-tasks.storage_path', 'direct-tasks').'/'.$task->id, $disk);

        return DirectTaskAttachment::query()->create([
            'task_id' => $task->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $mime,
            'file_size' => $file->getSize(),
            'uploaded_by' => Auth::id(),
        ]);
    }

    public function find(int $id): DirectTask
    {
        return DirectTask::query()
            ->with(['checklistItems', 'assignments', 'attachments', 'schedule'])
            ->findOrFail($id);
    }
}
