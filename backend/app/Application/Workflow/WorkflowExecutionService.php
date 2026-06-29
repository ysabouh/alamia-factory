<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Enums\WorkflowAssignmentType;
use App\Domain\Factory\Enums\WorkflowInstanceStatus;
use App\Domain\Factory\Enums\WorkflowPriority;
use App\Domain\Factory\Enums\WorkflowTaskStatus;
use App\Domain\Factory\Enums\WorkflowTemplateVersionStatus;
use App\Domain\Factory\Enums\WorkflowTimelineAction;
use App\Domain\Factory\Enums\WorkflowTransitionConditionType;
use App\Domain\Factory\Models\WorkflowInstance;
use App\Domain\Factory\Models\WorkflowStage;
use App\Domain\Factory\Models\WorkflowStageTransition;
use App\Domain\Factory\Models\WorkflowTask;
use App\Domain\Factory\Models\WorkflowTaskAttachment;
use App\Domain\Factory\Models\WorkflowTaskChecklistCompletion;
use App\Domain\Factory\Models\WorkflowTaskComment;
use App\Domain\Factory\Models\WorkflowTemplate;
use App\Domain\Factory\Models\WorkflowTemplateVersion;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkflowExecutionService
{
    public function __construct(
        private readonly WorkflowNumberGenerator $numbers,
        private readonly WorkflowAssignmentResolver $resolver,
        private readonly WorkflowTimelineService $timeline,
        private readonly WorkflowAuditLogger $audit,
        private readonly WorkflowNotificationService $notifications,
        private readonly WorkflowSubjectRegistry $subjects,
    ) {}

    /**
     * @param  array{
     *   templateId?:int,
     *   templateVersionId?:int,
     *   subjectType?:string,
     *   subjectId?:int,
     *   priority?:string,
     *   dueDate?:?string
     * }  $data
     */
    public function start(array $data): WorkflowInstance
    {
        $version = $this->resolveVersion($data);
        if ($version->status !== WorkflowTemplateVersionStatus::Published) {
            throw ValidationException::withMessages(['version' => ['يجب استخدام نسخة منشورة.']]);
        }

        $firstStage = $version->stages()->orderBy('stage_number')->first();
        if (! $firstStage) {
            throw ValidationException::withMessages(['stages' => ['القالب لا يحتوي مراحل.']]);
        }

        $subject = $this->resolveSubject($data);
        $template = $version->template;
        $priority = $data['priority'] ?? $template->default_priority->value ?? WorkflowPriority::Normal->value;

        return DB::transaction(function () use ($version, $firstStage, $subject, $priority, $data): WorkflowInstance {
            $instance = WorkflowInstance::query()->create([
                'workflow_number' => $this->numbers->nextWorkflowNumber(),
                'template_version_id' => $version->id,
                'current_stage_id' => $firstStage->id,
                'status' => WorkflowInstanceStatus::Assigned,
                'priority' => $priority,
                'progress_percent' => 0,
                'started_at' => now(),
                'due_at' => isset($data['dueDate']) ? Carbon::parse($data['dueDate']) : null,
                'subject_type' => $subject?->getMorphClass(),
                'subject_id' => $subject?->getKey(),
                'initiated_by' => Auth::id(),
            ]);

            $this->spawnTasksForStage($instance, $firstStage);
            $this->timeline->record($instance, WorkflowTimelineAction::Created, notes: 'بدء سير العمل');
            $this->audit->log($instance, 'started', null, ['workflowNumber' => $instance->workflow_number]);

            return $instance->load([
                'templateVersion.template',
                'currentStage',
                'tasks.assignee',
                'subject',
            ]);
        });
    }

    public function acceptTask(WorkflowTask $task): WorkflowTask
    {
        $this->assertAssignee($task);

        return DB::transaction(function () use ($task): WorkflowTask {
            $task->update([
                'status' => WorkflowTaskStatus::Accepted,
                'accepted_at' => now(),
            ]);
            $task->instance->update(['status' => WorkflowInstanceStatus::Accepted]);
            $this->timeline->record($task->instance, WorkflowTimelineAction::Accepted, $task->id);

            return $task->fresh(['stage', 'assignee', 'instance']);
        });
    }

    public function rejectTask(WorkflowTask $task, string $reason): WorkflowTask
    {
        $this->assertAssignee($task);
        $stage = $task->stage;

        if (! $stage->allow_rejection) {
            throw ValidationException::withMessages(['task' => ['الرفض غير مسموح في هذه المرحلة.']]);
        }

        return DB::transaction(function () use ($task, $reason, $stage): WorkflowTask {
            $task->update(['status' => WorkflowTaskStatus::Rejected, 'completed_at' => now()]);
            $instance = WorkflowInstance::query()->lockForUpdate()->findOrFail($task->instance_id);

            WorkflowTaskComment::query()->create([
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'type' => 'rejection',
                'body' => $reason,
            ]);

            $nextStage = $this->resolveNextStage($instance, $stage, WorkflowTransitionConditionType::OnReject);
            if ($nextStage) {
                $instance->tasks()
                    ->where('stage_id', $stage->id)
                    ->where('id', '!=', $task->id)
                    ->whereNotIn('status', [WorkflowTaskStatus::Completed, WorkflowTaskStatus::Rejected])
                    ->update(['status' => WorkflowTaskStatus::Cancelled]);

                $this->moveToStage($instance, $stage, $nextStage, $task, WorkflowTransitionConditionType::OnReject, $reason);
                $this->timeline->record($instance, WorkflowTimelineAction::Rejected, $task->id, $reason);

                return $task->fresh();
            }

            $instance->update([
                'status' => WorkflowInstanceStatus::Rejected,
                'completed_at' => now(),
            ]);

            $this->timeline->record($instance, WorkflowTimelineAction::Rejected, $task->id, $reason);
            $this->subjects->onRejected($instance);

            return $task->fresh();
        });
    }

    public function requestClarification(WorkflowTask $task, string $body): WorkflowTask
    {
        $this->assertAssignee($task);

        return DB::transaction(function () use ($task, $body): WorkflowTask {
            WorkflowTaskComment::query()->create([
                'task_id' => $task->id,
                'user_id' => Auth::id(),
                'type' => 'clarification',
                'body' => $body,
            ]);

            $task->update(['status' => WorkflowTaskStatus::WaitingInformation]);
            $task->instance->update(['status' => WorkflowInstanceStatus::WaitingInformation]);
            $this->timeline->record($task->instance, WorkflowTimelineAction::ClarificationRequested, $task->id, $body);

            return $task->fresh(['comments']);
        });
    }

    public function addComment(WorkflowTask $task, string $body): WorkflowTaskComment
    {
        return WorkflowTaskComment::query()->create([
            'task_id' => $task->id,
            'user_id' => Auth::id(),
            'type' => 'comment',
            'body' => $body,
        ]);
    }

    /**
     * @param  array<int, array{checklistItemId:int, isCompleted:bool}>  $checklist
     */
    public function completeTask(WorkflowTask $task, array $checklist = [], ?string $note = null): WorkflowTask
    {
        $this->assertAssignee($task);

        return DB::transaction(function () use ($task, $checklist, $note): WorkflowTask {
            $instance = WorkflowInstance::query()->lockForUpdate()->findOrFail($task->instance_id);
            $stage = $task->stage;

            $this->syncChecklist($task, $checklist);
            $this->validateChecklist($task, $stage);
            $this->validateAttachments($task, $stage);

            $now = now();
            $duration = $task->started_at
                ? (int) $task->started_at->diffInMinutes($now)
                : ($stage->estimated_duration_minutes ?? 0);

            $task->update([
                'status' => WorkflowTaskStatus::Completed,
                'completed_at' => $now,
                'duration_minutes' => $duration,
                'completed_by' => Auth::id(),
            ]);

            if ($note) {
                $this->addComment($task, $note);
            }

            if ($stage->requires_approval) {
                $instance->update(['status' => WorkflowInstanceStatus::WaitingApproval]);
                $this->timeline->record($instance, WorkflowTimelineAction::Updated, $task->id, 'بانتظار الموافقة');

                return $task->fresh();
            }

            if ($this->stageHasPendingGatewayDecision($instance->template_version_id, $stage->id)) {
                $instance->update(['status' => WorkflowInstanceStatus::WaitingApproval]);
                $this->timeline->record($instance, WorkflowTimelineAction::Updated, $task->id, 'بانتظار قرار المسار');

                return $task->fresh(['instance']);
            }

            if (! $this->canAdvanceStage($instance, $stage, $task)) {
                if ($stage->assignment_type === WorkflowAssignmentType::Sequential) {
                    $this->spawnNextSequentialTask($instance, $stage, $task);
                }

                return $task->fresh(['instance']);
            }

            $this->advanceStage($instance, $stage, $task, WorkflowTransitionConditionType::Default);

            return $task->fresh(['instance.currentStage', 'instance.tasks']);
        });
    }

    public function approveTask(WorkflowTask $task): WorkflowTask
    {
        return DB::transaction(function () use ($task): WorkflowTask {
            $instance = WorkflowInstance::query()->lockForUpdate()->findOrFail($task->instance_id);
            $stage = $task->stage;

            $this->timeline->record($instance, WorkflowTimelineAction::Approved, $task->id);
            $this->advanceStage($instance, $stage, $task, WorkflowTransitionConditionType::OnApprove);

            return $task->fresh(['instance']);
        });
    }

    public function chooseGatewayPath(WorkflowTask $task, WorkflowTransitionConditionType $condition): WorkflowTask
    {
        if (! in_array($condition, [WorkflowTransitionConditionType::OnApprove, WorkflowTransitionConditionType::OnReject], true)) {
            throw ValidationException::withMessages(['condition' => ['شرط المسار غير صالح.']]);
        }

        $this->assertAssignee($task);

        return DB::transaction(function () use ($task, $condition): WorkflowTask {
            $instance = WorkflowInstance::query()->lockForUpdate()->findOrFail($task->instance_id);
            $stage = $task->stage;

            if ($task->status !== WorkflowTaskStatus::Completed) {
                throw ValidationException::withMessages(['task' => ['يجب إكمال المهمة قبل اختيار المسار.']]);
            }

            if ($instance->status !== WorkflowInstanceStatus::WaitingApproval) {
                throw ValidationException::withMessages(['instance' => ['لا يوجد قرار مسار معلّق.']]);
            }

            if ($stage->requires_approval) {
                throw ValidationException::withMessages(['task' => ['استخدم اعتماد/رفض المدير في هذه المرحلة.']]);
            }

            if (! $this->stageHasPendingGatewayDecision($instance->template_version_id, $stage->id)) {
                throw ValidationException::withMessages(['instance' => ['لا يوجد تفرع مسار بانتظار القرار.']]);
            }

            $label = $condition === WorkflowTransitionConditionType::OnApprove ? 'موافقة' : 'رفض';
            $this->timeline->record($instance, WorkflowTimelineAction::Updated, $task->id, 'اختيار المسار: '.$label);
            $this->advanceStage($instance, $stage, $task, $condition);

            return $task->fresh(['instance.currentStage', 'instance.tasks']);
        });
    }

    /**
     * @return array{taskId: int, options: array<int, array{condition: string, label: string, targetStageName: string}>}|null
     */
    public function resolveGatewayDecision(WorkflowInstance $instance): ?array
    {
        if ($instance->status !== WorkflowInstanceStatus::WaitingApproval) {
            return null;
        }

        $stage = $instance->currentStage;
        if (! $stage || $stage->requires_approval) {
            return null;
        }

        if (! $this->stageHasPendingGatewayDecision($instance->template_version_id, $stage->id)) {
            return null;
        }

        $task = $instance->relationLoaded('tasks')
            ? $instance->tasks
                ->where('stage_id', $stage->id)
                ->where('status', WorkflowTaskStatus::Completed)
                ->sortByDesc(fn (WorkflowTask $t) => $t->completed_at?->timestamp ?? 0)
                ->first()
            : WorkflowTask::query()
                ->where('instance_id', $instance->id)
                ->where('stage_id', $stage->id)
                ->where('status', WorkflowTaskStatus::Completed)
                ->orderByDesc('completed_at')
                ->first();

        if (! $task) {
            return null;
        }

        $transitions = WorkflowStageTransition::query()
            ->where('template_version_id', $instance->template_version_id)
            ->where('from_stage_id', $stage->id)
            ->whereNotNull('from_gateway_node_id')
            ->whereIn('condition_type', [
                WorkflowTransitionConditionType::OnApprove,
                WorkflowTransitionConditionType::OnReject,
            ])
            ->orderBy('sort_order')
            ->get();

        if ($transitions->isEmpty()) {
            return null;
        }

        $stageNames = WorkflowStage::query()
            ->whereIn('id', $transitions->pluck('to_stage_id'))
            ->pluck('name', 'id');

        return [
            'taskId' => $task->id,
            'options' => $transitions->map(fn (WorkflowStageTransition $t) => [
                'condition' => $t->condition_type->value,
                'label' => $t->label ?? ($t->condition_type === WorkflowTransitionConditionType::OnApprove ? 'نعم' : 'لا'),
                'targetStageName' => (string) ($stageNames[$t->to_stage_id] ?? ''),
            ])->values()->all(),
        ];
    }

    public function returnToPreviousStage(WorkflowInstance $instance, string $reason): WorkflowInstance
    {
        $current = $instance->currentStage;
        if (! $current?->allow_return) {
            throw ValidationException::withMessages(['instance' => ['الإرجاع غير مسموح.']]);
        }

        $returnTransition = WorkflowStageTransition::query()
            ->where('template_version_id', $instance->template_version_id)
            ->where('from_stage_id', $current->id)
            ->where('condition_type', WorkflowTransitionConditionType::OnReturn)
            ->orderBy('sort_order')
            ->first();

        $previous = $returnTransition
            ? WorkflowStage::query()->find($returnTransition->to_stage_id)
            : WorkflowStage::query()
                ->where('template_version_id', $instance->template_version_id)
                ->where('next_stage_id', $current->id)
                ->first();

        if (! $previous) {
            throw ValidationException::withMessages(['instance' => ['لا توجد مرحلة سابقة.']]);
        }

        return DB::transaction(function () use ($instance, $current, $previous, $reason): WorkflowInstance {
            $instance->tasks()->where('stage_id', $instance->current_stage_id)->update([
                'status' => WorkflowTaskStatus::Cancelled,
            ]);

            $instance->update([
                'current_stage_id' => $previous->id,
                'status' => WorkflowInstanceStatus::InProgress,
            ]);

            $this->spawnTasksForStage($instance, $previous);
            $this->timeline->record($instance, WorkflowTimelineAction::Returned, notes: $reason);

            return $instance->fresh(['currentStage', 'tasks']);
        });
    }

    public function assignExecutor(WorkflowTask $task, int $employeeId): WorkflowTask
    {
        $task->update([
            'assigned_to' => $employeeId,
            'status' => WorkflowTaskStatus::Assigned,
        ]);
        $this->notifications->notifyTaskAssigned($task->fresh());

        return $task->fresh(['assignee']);
    }

    public function storeAttachment(WorkflowTask $task, string $fileName, string $path, ?string $mime, ?int $size): WorkflowTaskAttachment
    {
        return WorkflowTaskAttachment::query()->create([
            'task_id' => $task->id,
            'file_name' => $fileName,
            'file_path' => $path,
            'mime_type' => $mime,
            'file_size' => $size,
            'uploaded_by' => Auth::id(),
        ]);
    }

  private function spawnTasksForStage(WorkflowInstance $instance, WorkflowStage $stage): void
    {
        $assignees = $this->resolver->resolve($stage);
        $isSequential = $stage->assignment_type === WorkflowAssignmentType::Sequential;

        if ($isSequential) {
            $assignees = $assignees->take(1);
        }

        $dueAt = $stage->sla_duration_minutes
            ? now()->addMinutes($stage->sla_duration_minutes)
            : null;

        foreach ($assignees as $row) {
            $task = WorkflowTask::query()->create([
                'task_number' => $this->numbers->nextTaskNumber(),
                'instance_id' => $instance->id,
                'stage_id' => $stage->id,
                'assigned_to' => $row['employee_id'],
                'sequence_order' => $row['sequence_order'],
                'status' => WorkflowTaskStatus::Assigned,
                'priority' => $instance->priority,
                'due_at' => $dueAt,
                'started_at' => now(),
            ]);

            foreach ($stage->checklistItems as $item) {
                WorkflowTaskChecklistCompletion::query()->create([
                    'task_id' => $task->id,
                    'checklist_item_id' => $item->id,
                    'is_completed' => false,
                ]);
            }

            $this->notifications->notifyTaskAssigned($task);
            $this->timeline->record($instance, WorkflowTimelineAction::Assigned, $task->id);
        }

        $instance->update(['status' => WorkflowInstanceStatus::InProgress]);
    }

    private function spawnNextSequentialTask(WorkflowInstance $instance, WorkflowStage $stage, WorkflowTask $completed): void
    {
        $nextId = $this->resolver->nextSequentialAssignee($stage, $completed->sequence_order);
        if (! $nextId) {
            return;
        }

        $dueAt = $stage->sla_duration_minutes ? now()->addMinutes($stage->sla_duration_minutes) : null;
        $task = WorkflowTask::query()->create([
            'task_number' => $this->numbers->nextTaskNumber(),
            'instance_id' => $instance->id,
            'stage_id' => $stage->id,
            'assigned_to' => $nextId,
            'sequence_order' => $completed->sequence_order + 1,
            'status' => WorkflowTaskStatus::Assigned,
            'priority' => $instance->priority,
            'due_at' => $dueAt,
            'started_at' => now(),
        ]);

        $this->notifications->notifyTaskAssigned($task);
    }

    private function canAdvanceStage(WorkflowInstance $instance, WorkflowStage $stage, WorkflowTask $completedTask): bool
    {
        return match ($stage->assignment_type) {
            WorkflowAssignmentType::MultipleAll => $instance->tasks()
                ->where('stage_id', $stage->id)
                ->where('status', '!=', WorkflowTaskStatus::Completed)
                ->doesntExist(),
            WorkflowAssignmentType::MultipleAny => true,
            WorkflowAssignmentType::Sequential => $this->resolver->nextSequentialAssignee($stage, $completedTask->sequence_order) === null,
            default => true,
        };
    }

    private function advanceStage(
        WorkflowInstance $instance,
        WorkflowStage $stage,
        WorkflowTask $task,
        WorkflowTransitionConditionType $condition = WorkflowTransitionConditionType::Default,
    ): void {
        $totalStages = WorkflowStage::query()
            ->where('template_version_id', $instance->template_version_id)
            ->count();
        $completedCount = WorkflowStage::query()
            ->where('template_version_id', $instance->template_version_id)
            ->where('stage_number', '<=', $stage->stage_number)
            ->count();

        $progress = $totalStages > 0 ? (int) round(($completedCount / $totalStages) * 100) : 100;

        $next = $this->resolveNextStage($instance, $stage, $condition);
        if ($next) {
            $this->moveToStage($instance, $stage, $next, $task, $condition);

            return;
        }

        if ($stage->next_stage_id && ! $this->stageHasPendingGatewayDecision($instance->template_version_id, $stage->id)) {
            $fallback = WorkflowStage::query()->find($stage->next_stage_id);
            if ($fallback) {
                $this->moveToStage($instance, $stage, $fallback, $task, $condition);

                return;
            }
        }

        $hasTransitions = WorkflowStageTransition::query()
            ->where('template_version_id', $instance->template_version_id)
            ->where('from_stage_id', $stage->id)
            ->exists();

        if ($hasTransitions) {
            throw ValidationException::withMessages([
                'transition' => ['لا يوجد مسار انتقال للشرط: '.$condition->value],
            ]);
        }

        $instance->update([
            'progress_percent' => 100,
            'status' => WorkflowInstanceStatus::Completed,
            'completed_at' => now(),
            'current_stage_id' => null,
        ]);
        $this->timeline->record($instance, WorkflowTimelineAction::Completed, $task->id);
        $this->subjects->onCompleted($instance);
    }

    private function resolveNextStage(
        WorkflowInstance $instance,
        WorkflowStage $stage,
        WorkflowTransitionConditionType $condition,
    ): ?WorkflowStage {
        $transition = WorkflowStageTransition::query()
            ->where('template_version_id', $instance->template_version_id)
            ->where('from_stage_id', $stage->id)
            ->where('condition_type', $condition)
            ->orderBy('sort_order')
            ->first();

        if (! $transition && $condition !== WorkflowTransitionConditionType::Default) {
            $transition = WorkflowStageTransition::query()
                ->where('template_version_id', $instance->template_version_id)
                ->where('from_stage_id', $stage->id)
                ->where('condition_type', WorkflowTransitionConditionType::Default)
                ->orderBy('sort_order')
                ->first();
        }

        if (! $transition && $condition === WorkflowTransitionConditionType::Default) {
            if ($this->stageHasPendingGatewayDecision($instance->template_version_id, $stage->id)) {
                return null;
            }

            $transition = WorkflowStageTransition::query()
                ->where('template_version_id', $instance->template_version_id)
                ->where('from_stage_id', $stage->id)
                ->orderBy('sort_order')
                ->first();
        }

        if (! $transition) {
            return null;
        }

        return WorkflowStage::query()->find($transition->to_stage_id);
    }

    private function moveToStage(
        WorkflowInstance $instance,
        WorkflowStage $fromStage,
        WorkflowStage $next,
        WorkflowTask $task,
        WorkflowTransitionConditionType $condition,
        ?string $notes = null,
    ): void {
        $totalStages = WorkflowStage::query()
            ->where('template_version_id', $instance->template_version_id)
            ->count();
        $completedCount = WorkflowStage::query()
            ->where('template_version_id', $instance->template_version_id)
            ->where('stage_number', '<=', $fromStage->stage_number)
            ->count();
        $progress = $totalStages > 0 ? (int) round(($completedCount / $totalStages) * 100) : 100;

        $instance->update([
            'current_stage_id' => $next->id,
            'progress_percent' => min(99, $progress),
            'status' => WorkflowInstanceStatus::InProgress,
        ]);
        $this->spawnTasksForStage($instance, $next);

        $conditionLabel = match ($condition) {
            WorkflowTransitionConditionType::OnApprove => 'موافقة',
            WorkflowTransitionConditionType::OnReject => 'رفض',
            WorkflowTransitionConditionType::OnReturn => 'إرجاع',
            default => 'افتراضي',
        };
        $timelineNote = $notes ?? ('الانتقال إلى: '.$next->name.' ('.$conditionLabel.')');
        $this->timeline->record($instance, WorkflowTimelineAction::StageAdvanced, $task->id, $timelineNote);
    }

    /**
     * @param  array<int, array{checklistItemId:int, isCompleted:bool}>  $checklist
     */
    private function syncChecklist(WorkflowTask $task, array $checklist): void
    {
        foreach ($checklist as $row) {
            WorkflowTaskChecklistCompletion::query()
                ->where('task_id', $task->id)
                ->where('checklist_item_id', $row['checklistItemId'])
                ->update([
                    'is_completed' => (bool) $row['isCompleted'],
                    'completed_by' => $row['isCompleted'] ? Auth::id() : null,
                    'completed_at' => $row['isCompleted'] ? now() : null,
                ]);
        }
    }

    private function validateChecklist(WorkflowTask $task, WorkflowStage $stage): void
    {
        if (! $stage->checklist_required) {
            return;
        }

        $incomplete = $task->checklistCompletions()
            ->whereHas('checklistItem', fn ($q) => $q->where('is_required', true))
            ->where('is_completed', false)
            ->exists();

        if ($incomplete) {
            throw ValidationException::withMessages(['checklist' => ['يجب إكمال جميع بنود القائمة الإلزامية.']]);
        }
    }

    private function validateAttachments(WorkflowTask $task, WorkflowStage $stage): void
    {
        $required = $stage->required_attachments ?? [];
        if (! is_array($required) || count($required) === 0) {
            return;
        }

        $count = $task->attachments()->count();
        if ($count < count($required)) {
            throw ValidationException::withMessages(['attachments' => ['يجب رفع المرفقات المطلوبة.']]);
        }
    }

    private function stageHasPendingGatewayDecision(int $templateVersionId, int $stageId): bool
    {
        $transitions = WorkflowStageTransition::query()
            ->where('template_version_id', $templateVersionId)
            ->where('from_stage_id', $stageId)
            ->get();

        if ($transitions->isEmpty()) {
            return false;
        }

        if ($transitions->contains(fn (WorkflowStageTransition $t) => $t->condition_type === WorkflowTransitionConditionType::Default)) {
            return false;
        }

        return $transitions->contains(fn (WorkflowStageTransition $t) => $t->from_gateway_node_id !== null
            && in_array($t->condition_type, [WorkflowTransitionConditionType::OnApprove, WorkflowTransitionConditionType::OnReject], true));
    }

    private function assertAssignee(WorkflowTask $task): void
    {
        $user = Auth::user();
        if (! $user?->employee_id || $user->employee_id !== $task->assigned_to) {
            if (! $user?->can('workflow.instances.manage')) {
                throw ValidationException::withMessages(['task' => ['غير مصرح بتنفيذ هذه المهمة.']]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveVersion(array $data): WorkflowTemplateVersion
    {
        if (! empty($data['templateVersionId'])) {
            return WorkflowTemplateVersion::query()->with('stages.checklistItems', 'template')->findOrFail($data['templateVersionId']);
        }

        $template = WorkflowTemplate::query()->findOrFail($data['templateId'] ?? 0);
        $version = $template->publishedVersion;
        if (! $version) {
            throw ValidationException::withMessages(['template' => ['القالب ليس له نسخة منشورة.']]);
        }

        return $version->load('stages.checklistItems', 'template');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveSubject(array $data): ?Model
    {
        if (empty($data['subjectType']) || empty($data['subjectId'])) {
            return null;
        }

        $class = $this->subjects->resolveModelClass((string) $data['subjectType']);

        return $class::query()->findOrFail($data['subjectId']);
    }
}
