<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Workflow;

use App\Application\Workflow\WorkflowExecutionService;
use App\Domain\Factory\Enums\WorkflowTransitionConditionType;
use App\Domain\Factory\Models\WorkflowTask;
use App\Interfaces\Http\Support\SerializesWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class WorkflowTasksController
{
    use SerializesWorkflow;

    public function __construct(
        private readonly WorkflowExecutionService $execution,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = WorkflowTask::query()->with(['stage', 'assignee', 'instance']);

        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }
        if ($departmentId = $request->integer('departmentId')) {
            $q->whereHas('assignee', fn ($b) => $b->where('department_id', $departmentId));
        }
        if ($from = $request->string('from')->toString()) {
            $q->whereDate('due_at', '>=', $from);
        }
        if ($to = $request->string('to')->toString()) {
            $q->whereDate('due_at', '<=', $to);
        }

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = min(100, max(1, (int) $request->input('pageSize', 20)));
        $total = (clone $q)->count();
        $rows = $q->orderByDesc('id')->forPage($page, $pageSize)->get();

        return response()->json([
            'data' => $rows->map(fn ($t) => $this->serializeTask($t))->values()->all(),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total],
        ]);
    }

    public function my(Request $request): JsonResponse
    {
        $employeeId = Auth::user()?->employee_id;
        $q = WorkflowTask::query()
            ->with(['stage', 'assignee', 'instance.templateVersion.template', 'checklistCompletions.checklistItem'])
            ->when($employeeId, fn ($b) => $b->where('assigned_to', $employeeId));

        if ($section = $request->string('section')->toString()) {
            $q->whereIn('status', match ($section) {
                'new' => ['pending', 'assigned'],
                'assigned' => ['assigned'],
                'in_progress' => ['accepted', 'in_progress'],
                'waiting_approval' => ['waiting_approval'],
                'completed' => ['completed'],
                'delayed' => ['overdue'],
                default => [],
            });
        }

        $rows = $q->orderByDesc('due_at')->limit(200)->get();

        return response()->json([
            'data' => $rows->map(fn ($t) => $this->serializeTask($t))->values()->all(),
        ]);
    }

    public function show(WorkflowTask $task): JsonResponse
    {
        $task->load([
            'stage.checklistItems',
            'assignee',
            'instance.templateVersion.template',
            'checklistCompletions.checklistItem',
            'comments.user',
            'attachments',
        ]);

        return response()->json($this->serializeTask($task));
    }

    public function accept(WorkflowTask $task): JsonResponse
    {
        return response()->json($this->serializeTask($this->execution->acceptTask($task)));
    }

    public function reject(Request $request, WorkflowTask $task): JsonResponse
    {
        $data = $request->validate(['reason' => ['required', 'string']]);

        return response()->json($this->serializeTask($this->execution->rejectTask($task, $data['reason'])));
    }

    public function clarify(Request $request, WorkflowTask $task): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string']]);

        return response()->json($this->serializeTask($this->execution->requestClarification($task, $data['body'])));
    }

    public function comment(Request $request, WorkflowTask $task): JsonResponse
    {
        $data = $request->validate(['body' => ['required', 'string']]);
        $comment = $this->execution->addComment($task, $data['body']);

        return response()->json([
            'id' => $comment->id,
            'body' => $comment->body,
            'createdAt' => $comment->created_at?->toIso8601String(),
        ], 201);
    }

    public function complete(Request $request, WorkflowTask $task): JsonResponse
    {
        $data = $request->validate([
            'checklist' => ['nullable', 'array'],
            'checklist.*.checklistItemId' => ['required', 'integer'],
            'checklist.*.isCompleted' => ['required', 'boolean'],
            'note' => ['nullable', 'string'],
        ]);

        $task = $this->execution->completeTask($task, $data['checklist'] ?? [], $data['note'] ?? null);

        return response()->json($this->serializeTask($task));
    }

    public function approve(WorkflowTask $task): JsonResponse
    {
        return response()->json($this->serializeTask($this->execution->approveTask($task)));
    }

    public function chooseGatewayPath(Request $request, WorkflowTask $task): JsonResponse
    {
        $data = $request->validate([
            'condition' => ['required', 'string', 'in:on_approve,on_reject'],
        ]);

        $condition = WorkflowTransitionConditionType::from($data['condition']);

        return response()->json($this->serializeTask($this->execution->chooseGatewayPath($task, $condition)));
    }

    public function assign(Request $request, WorkflowTask $task): JsonResponse
    {
        $data = $request->validate(['employeeId' => ['required', 'integer', 'exists:employees,id']]);

        return response()->json($this->serializeTask($this->execution->assignExecutor($task, $data['employeeId'])));
    }

    public function uploadAttachment(Request $request, WorkflowTask $task): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'max:10240']]);
        $file = $request->file('file');
        $path = $file->store('workflow/attachments', 'public');

        $attachment = $this->execution->storeAttachment(
            $task,
            $file->getClientOriginalName(),
            $path,
            $file->getMimeType(),
            $file->getSize(),
        );

        return response()->json([
            'id' => $attachment->id,
            'fileName' => $attachment->file_name,
            'filePath' => Storage::disk('public')->url($attachment->file_path),
        ], 201);
    }
}
