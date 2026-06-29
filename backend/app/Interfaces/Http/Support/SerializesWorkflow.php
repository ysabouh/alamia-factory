<?php

namespace App\Interfaces\Http\Support;

use App\Application\Workflow\WorkflowSubjectRegistry;
use App\Domain\Factory\Models\WorkflowInstance;
use App\Domain\Factory\Models\WorkflowStage;
use App\Domain\Factory\Models\WorkflowStageTransition;
use App\Domain\Factory\Models\WorkflowTask;
use App\Domain\Factory\Models\WorkflowTemplate;
use App\Domain\Factory\Models\WorkflowTemplateVersion;
use App\Domain\Factory\Models\WorkflowTimelineEntry;

trait SerializesWorkflow
{
    protected function serializeTemplate(WorkflowTemplate $t): array
    {
        return [
            'id' => $t->id,
            'code' => $t->code,
            'name' => $t->name,
            'description' => $t->description,
            'category' => $t->category?->value ?? $t->category,
            'departmentId' => $t->department_id,
            'department' => $t->relationLoaded('department') && $t->department
                ? ['id' => $t->department->id, 'name' => $t->department->name, 'code' => $t->department->code]
                : null,
            'isActive' => (bool) $t->is_active,
            'defaultPriority' => $t->default_priority?->value ?? $t->default_priority,
            'publishedVersionId' => $t->published_version_id,
            'publishedVersion' => $t->relationLoaded('publishedVersion') && $t->publishedVersion
                ? $this->serializeVersion($t->publishedVersion)
                : null,
            'versions' => $t->relationLoaded('versions')
                ? $t->versions->map(fn ($v) => $this->serializeVersion($v))->values()->all()
                : null,
            'createdAt' => $t->created_at?->toIso8601String(),
            'updatedAt' => $t->updated_at?->toIso8601String(),
        ];
    }

    protected function serializeVersion(WorkflowTemplateVersion $v): array
    {
        return [
            'id' => $v->id,
            'templateId' => $v->template_id,
            'version' => $v->version,
            'status' => $v->status?->value ?? $v->status,
            'definitionJson' => $v->definition_json,
            'publishedAt' => $v->published_at?->toIso8601String(),
            'stages' => $v->relationLoaded('stages')
                ? $v->stages->map(fn ($s) => $this->serializeStage($s))->values()->all()
                : null,
            'transitions' => $v->relationLoaded('transitions')
                ? $v->transitions->map(fn ($t) => $this->serializeTransition($t))->values()->all()
                : null,
        ];
    }

    protected function serializeTransition(WorkflowStageTransition $t): array
    {
        return [
            'id' => $t->id,
            'templateVersionId' => $t->template_version_id,
            'fromStageId' => $t->from_stage_id,
            'toStageId' => $t->to_stage_id,
            'fromGatewayNodeId' => $t->from_gateway_node_id,
            'conditionType' => $t->condition_type?->value ?? $t->condition_type,
            'label' => $t->label,
            'sortOrder' => $t->sort_order,
        ];
    }

    protected function serializeStageProgress(WorkflowStage $s, string $state): array
    {
        return [
            'id' => $s->id,
            'name' => $s->name,
            'stageNumber' => $s->stage_number,
            'nodeId' => $s->node_id,
            'state' => $state,
        ];
    }

    /**
     * @param  iterable<WorkflowStage>  $stages
     * @return array{completedCount:int,currentCount:int,remainingCount:int,totalStages:int,stageStates:array<int,array<string,mixed>>}
     */
    protected function buildStageProgressMetrics(WorkflowInstance $instance, iterable $stages): array
    {
        $currentId = $instance->current_stage_id;
        $isCompleted = $instance->status->value === 'completed';
        $currentNum = $instance->currentStage?->stage_number ?? ($isCompleted ? PHP_INT_MAX : 0);

        $completedCount = 0;
        $currentCount = 0;
        $remainingCount = 0;
        $stageStates = [];

        foreach ($stages as $s) {
            $state = $isCompleted ? 'completed'
                : ($s->stage_number < $currentNum ? 'completed'
                : ($s->id === $currentId ? 'current' : 'pending'));

            if ($state === 'completed') {
                $completedCount++;
            } elseif ($state === 'current') {
                $currentCount++;
            } else {
                $remainingCount++;
            }

            $stageStates[] = $this->serializeStageProgress($s, $state);
        }

        return [
            'completedCount' => $completedCount,
            'currentCount' => $currentCount,
            'remainingCount' => $remainingCount,
            'totalStages' => count($stageStates),
            'stageStates' => $stageStates,
        ];
    }

    protected function serializeStage(WorkflowStage $s): array
    {
        return [
            'id' => $s->id,
            'templateVersionId' => $s->template_version_id,
            'stageNumber' => $s->stage_number,
            'name' => $s->name,
            'description' => $s->description,
            'estimatedDurationMinutes' => $s->estimated_duration_minutes,
            'slaDurationMinutes' => $s->sla_duration_minutes,
            'assignmentType' => $s->assignment_type?->value ?? $s->assignment_type,
            'assignmentConfig' => $s->assignment_config,
            'requiresApproval' => (bool) $s->requires_approval,
            'allowRejection' => (bool) $s->allow_rejection,
            'allowReturn' => (bool) $s->allow_return,
            'checklistRequired' => (bool) $s->checklist_required,
            'requiredAttachments' => $s->required_attachments,
            'nextStageId' => $s->next_stage_id,
            'positionX' => $s->position_x,
            'positionY' => $s->position_y,
            'nodeId' => $s->node_id,
            'checklist' => $s->relationLoaded('checklistItems')
                ? $s->checklistItems->map(fn ($c) => [
                    'id' => $c->id,
                    'label' => $c->label,
                    'sortOrder' => $c->sort_order,
                    'isRequired' => (bool) $c->is_required,
                ])->values()->all()
                : [],
        ];
    }

    protected function serializeInstance(
        WorkflowInstance $i,
        ?WorkflowSubjectRegistry $registry = null,
        ?\App\Application\Workflow\WorkflowExecutionService $execution = null,
    ): array {
        $subject = null;
        if ($registry && $i->relationLoaded('subject')) {
            $subject = $registry->summarize($i);
        }

        return [
            'id' => $i->id,
            'workflowNumber' => $i->workflow_number,
            'templateVersionId' => $i->template_version_id,
            'templateVersion' => $i->relationLoaded('templateVersion') && $i->templateVersion
                ? $this->serializeVersion($i->templateVersion)
                : null,
            'templateName' => $i->relationLoaded('templateVersion') && $i->templateVersion?->relationLoaded('template') && $i->templateVersion->template
                ? $i->templateVersion->template->name
                : null,
            'currentStageId' => $i->current_stage_id,
            'currentStage' => $i->relationLoaded('currentStage') && $i->currentStage
                ? $this->serializeStage($i->currentStage)
                : null,
            'status' => $i->status?->value ?? $i->status,
            'priority' => $i->priority?->value ?? $i->priority,
            'progressPercent' => $i->progress_percent,
            'startedAt' => $i->started_at?->toIso8601String(),
            'dueAt' => $i->due_at?->toIso8601String(),
            'completedAt' => $i->completed_at?->toIso8601String(),
            'subjectType' => $i->subject_type,
            'subjectId' => $i->subject_id,
            'subject' => $subject,
            'tasks' => $i->relationLoaded('tasks')
                ? $i->tasks->map(fn ($t) => $this->serializeTask($t))->values()->all()
                : null,
            'gatewayDecision' => $execution?->resolveGatewayDecision($i),
            'createdAt' => $i->created_at?->toIso8601String(),
        ];
    }

    protected function serializeTask(WorkflowTask $t): array
    {
        return [
            'id' => $t->id,
            'taskNumber' => $t->task_number,
            'instanceId' => $t->instance_id,
            'workflowNumber' => $t->relationLoaded('instance') ? $t->instance?->workflow_number : null,
            'templateName' => $t->relationLoaded('instance')
                ? ($t->instance?->templateVersion?->template?->name)
                : null,
            'instanceStatus' => $t->relationLoaded('instance')
                ? ($t->instance?->status?->value ?? $t->instance?->status)
                : null,
            'stageId' => $t->stage_id,
            'stage' => $t->relationLoaded('stage') && $t->stage
                ? $this->serializeStage($t->stage)
                : null,
            'assignedTo' => $t->assigned_to,
            'assignee' => $t->relationLoaded('assignee') && $t->assignee
                ? ['id' => $t->assignee->id, 'name' => $t->assignee->name ?? trim(($t->assignee->first_name ?? '').' '.($t->assignee->last_name ?? ''))]
                : null,
            'sequenceOrder' => $t->sequence_order,
            'status' => $t->status?->value ?? $t->status,
            'priority' => $t->priority?->value ?? $t->priority,
            'dueAt' => $t->due_at?->toIso8601String(),
            'startedAt' => $t->started_at?->toIso8601String(),
            'acceptedAt' => $t->accepted_at?->toIso8601String(),
            'completedAt' => $t->completed_at?->toIso8601String(),
            'durationMinutes' => $t->duration_minutes,
            'isOverdue' => (bool) $t->is_overdue,
            'checklist' => $t->relationLoaded('checklistCompletions')
                ? $t->checklistCompletions->map(fn ($c) => [
                    'id' => $c->id,
                    'checklistItemId' => $c->checklist_item_id,
                    'label' => $c->relationLoaded('checklistItem') ? $c->checklistItem?->label : null,
                    'isCompleted' => (bool) $c->is_completed,
                ])->values()->all()
                : [],
            'comments' => $t->relationLoaded('comments')
                ? $t->comments->map(fn ($c) => [
                    'id' => $c->id,
                    'type' => $c->type,
                    'body' => $c->body,
                    'createdAt' => $c->created_at?->toIso8601String(),
                    'author' => $c->relationLoaded('user') && $c->user
                        ? ['id' => $c->user->id, 'name' => $c->user->name]
                        : null,
                ])->values()->all()
                : [],
            'attachments' => $t->relationLoaded('attachments')
                ? $t->attachments->map(fn ($a) => [
                    'id' => $a->id,
                    'fileName' => $a->file_name,
                    'filePath' => $a->file_path,
                ])->values()->all()
                : [],
        ];
    }

    protected function serializeTimelineEntry(WorkflowTimelineEntry $e): array
    {
        return [
            'id' => $e->id,
            'action' => $e->action?->value ?? $e->action,
            'taskId' => $e->task_id,
            'actorId' => $e->actor_id,
            'actor' => $e->relationLoaded('actor') && $e->actor
                ? ['id' => $e->actor->id, 'name' => $e->actor->name]
                : null,
            'notes' => $e->notes,
            'meta' => $e->meta,
            'createdAt' => $e->created_at?->toIso8601String(),
        ];
    }
}
