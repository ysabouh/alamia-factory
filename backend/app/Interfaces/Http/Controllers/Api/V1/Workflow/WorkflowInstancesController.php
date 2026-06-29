<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Workflow;

use App\Application\Workflow\WorkflowAssignmentLabelService;
use App\Application\Workflow\WorkflowExecutionService;
use App\Application\Workflow\WorkflowSubjectRegistry;
use App\Domain\Factory\Models\WorkflowInstance;
use App\Domain\Factory\Models\WorkflowStage;
use App\Domain\Factory\Models\WorkflowTimelineEntry;
use App\Interfaces\Http\Support\SerializesWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowInstancesController
{
    use SerializesWorkflow;

    public function __construct(
        private readonly WorkflowExecutionService $execution,
        private readonly WorkflowSubjectRegistry $subjects,
        private readonly WorkflowAssignmentLabelService $assignmentLabels,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = WorkflowInstance::query()->with(['templateVersion.template', 'currentStage', 'subject']);

        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = min(100, max(1, (int) $request->input('pageSize', 20)));
        $total = (clone $q)->count();
        $rows = $q->orderByDesc('id')->forPage($page, $pageSize)->get();

        return response()->json([
            'data' => $rows->map(fn ($i) => $this->serializeInstance($i, $this->subjects))->values()->all(),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total],
        ]);
    }

    public function show(WorkflowInstance $instance): JsonResponse
    {
        $instance->load([
            'templateVersion.template',
            'templateVersion.stages.checklistItems',
            'currentStage.checklistItems',
            'tasks.stage.checklistItems',
            'tasks.assignee',
            'tasks.checklistCompletions.checklistItem',
            'tasks.comments.user',
            'tasks.attachments',
            'subject',
        ]);

        return response()->json($this->serializeInstance($instance, $this->subjects, $this->execution));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'templateId' => ['nullable', 'integer', 'exists:workflow_templates,id'],
            'templateVersionId' => ['nullable', 'integer', 'exists:workflow_template_versions,id'],
            'subjectType' => ['nullable', 'string'],
            'subjectId' => ['nullable', 'integer'],
            'priority' => ['nullable', 'string', 'max:20'],
            'dueDate' => ['nullable', 'date'],
        ]);

        $instance = $this->execution->start($data);

        return response()->json($this->serializeInstance($instance, $this->subjects, $this->execution), 201);
    }

    public function progress(WorkflowInstance $instance): JsonResponse
    {
        $instance->load('templateVersion.stages', 'currentStage');

        $stages = $instance->templateVersion->stages;
        $metrics = $this->buildStageProgressMetrics($instance, $stages);

        return response()->json([
            'workflowNumber' => $instance->workflow_number,
            'progressPercent' => $instance->progress_percent,
            'currentStageId' => $instance->current_stage_id,
            'completedCount' => $metrics['completedCount'],
            'currentCount' => $metrics['currentCount'],
            'remainingCount' => $metrics['remainingCount'],
            'totalStages' => $metrics['totalStages'],
            'stages' => $metrics['stageStates'],
        ]);
    }

    public function graph(WorkflowInstance $instance): JsonResponse
    {
        $instance->load(['templateVersion.stages', 'templateVersion.transitions', 'currentStage']);

        $version = $instance->templateVersion;
        $metrics = $this->buildStageProgressMetrics($instance, $version->stages);
        $definitionJson = $this->assignmentLabels->enrichGraphWithAssigneeNames(
            is_array($version->definition_json) ? $version->definition_json : []
        );

        return response()->json([
            'definitionJson' => $definitionJson,
            'stageStates' => $metrics['stageStates'],
            'transitions' => $version->transitions
                ->map(fn ($t) => $this->serializeTransition($t))
                ->values()
                ->all(),
        ]);
    }

    public function timeline(WorkflowInstance $instance): JsonResponse
    {
        $entries = WorkflowTimelineEntry::query()
            ->where('instance_id', $instance->id)
            ->with('actor')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => $entries->map(fn ($e) => $this->serializeTimelineEntry($e))->values()->all(),
        ]);
    }

    public function returnStage(Request $request, WorkflowInstance $instance): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string']]);
        $instance = $this->execution->returnToPreviousStage($instance, $data['reason']);

        return response()->json($this->serializeInstance($instance, $this->subjects));
    }

    public function subjectTypes(): JsonResponse
    {
        return response()->json(['data' => $this->subjects->catalog()]);
    }
}
