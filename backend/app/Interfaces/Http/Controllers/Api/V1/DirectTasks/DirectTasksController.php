<?php

namespace App\Interfaces\Http\Controllers\Api\V1\DirectTasks;

use App\Application\DirectTasks\DirectTaskChecklistTemplateService;
use App\Application\DirectTasks\DirectTaskCreationService;
use App\Application\DirectTasks\DirectTaskDraftService;
use App\Application\DirectTasks\DirectTaskExecutionService;
use App\Application\DirectTasks\DirectTaskService;
use App\Domain\Factory\Enums\DirectTaskAssignmentType;
use App\Domain\Factory\Enums\DirectTaskCategory;
use App\Domain\Factory\Enums\DirectTaskChecklistItemType;
use App\Domain\Factory\Enums\DirectTaskPriority;
use App\Domain\Factory\Enums\DirectTaskType;
use App\Domain\Factory\Models\DirectTask;
use App\Domain\Factory\Models\DirectTaskChecklistItem;
use App\Interfaces\Http\Support\SerializesDirectTasks;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DirectTasksController
{
    use SerializesDirectTasks;

    public function __construct(
        private readonly DirectTaskCreationService $creation,
        private readonly DirectTaskService $tasks,
        private readonly DirectTaskDraftService $drafts,
        private readonly DirectTaskChecklistTemplateService $templates,
        private readonly DirectTaskExecutionService $execution,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = DirectTask::query()->with(['assignments', 'checklistItems', 'attachments']);

        if ($request->boolean('mine')) {
            $employeeId = $request->user()?->employee_id;
            if ($employeeId) {
                $q->whereHas('assignments', function ($assignment) use ($employeeId): void {
                    $assignment
                        ->where('assignment_type', DirectTaskAssignmentType::Employee->value)
                        ->where('assignee_id', $employeeId);
                });
            } else {
                $q->whereRaw('1 = 0');
            }
        }

        if ($status = $request->string('status')->toString()) {
            $q->where('status', $status);
        }

        if ($priority = $request->string('priority')->toString()) {
            $q->where('priority', $priority);
        }

        if ($category = $request->string('category')->toString()) {
            $q->where('category', $category);
        }

        if ($taskType = $request->string('taskType')->toString()) {
            $q->where('task_type', $taskType);
        }

        if ($search = trim($request->string('search')->toString())) {
            $q->where(function ($inner) use ($search): void {
                $inner
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('task_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = min(100, max(1, (int) $request->input('pageSize', 20)));
        $total = (clone $q)->count();
        $rows = $q->orderByDesc('id')->forPage($page, $pageSize)->get();

        return response()->json([
            'data' => $rows->map(fn ($t) => $this->serializeDirectTask($t))->values()->all(),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total],
        ]);
    }

    public function show(DirectTask $directTask): JsonResponse
    {
        return response()->json($this->serializeDirectTask($directTask));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);
        $task = $this->creation->create($data);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                if ($file) {
                    $this->tasks->storeAttachment($task, $file);
                }
            }
            $task->load('attachments');
        }

        $this->drafts->clear();

        return response()->json($this->serializeDirectTask($task), 201);
    }

    public function uploadAttachment(Request $request, DirectTask $directTask): JsonResponse
    {
        $user = $request->user();
        if ($user === null || (! $user->can('direct_tasks.execute') && ! $user->can('direct_tasks.create'))) {
            abort(403);
        }

        $request->validate(['file' => ['required', 'file']]);
        $attachment = $this->tasks->storeAttachment($directTask, $request->file('file'));

        return response()->json($this->serializeAttachment($attachment), 201);
    }

    public function start(DirectTask $directTask): JsonResponse
    {
        return response()->json($this->serializeDirectTask($this->execution->start($directTask)));
    }

    public function pause(DirectTask $directTask): JsonResponse
    {
        return response()->json($this->serializeDirectTask($this->execution->pause($directTask)));
    }

    public function complete(DirectTask $directTask): JsonResponse
    {
        return response()->json($this->serializeDirectTask($this->execution->complete($directTask)));
    }

    public function submitForReview(DirectTask $directTask): JsonResponse
    {
        return response()->json($this->serializeDirectTask($this->execution->submitForReview($directTask)));
    }

    public function updateChecklistItem(Request $request, DirectTask $directTask, DirectTaskChecklistItem $checklistItem): JsonResponse
    {
        $data = $request->validate([
            'isCompleted' => ['nullable', 'boolean'],
            'responseValue' => ['nullable', 'string', 'max:5000'],
        ]);

        $task = $this->execution->updateChecklistItem($directTask, $checklistItem, $data);

        return response()->json($this->serializeDirectTask($task));
    }

    public function addComment(Request $request, DirectTask $directTask): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'commentType' => ['nullable', 'string', 'in:comment,problem,help'],
        ]);

        $comment = $this->execution->addComment($directTask, $data['body'], $data['commentType'] ?? 'comment');

        return response()->json($this->serializeComment($comment), 201);
    }

    public function checklistTemplates(): JsonResponse
    {
        $rows = $this->templates->listActive();

        return response()->json([
            'data' => $rows->map(fn ($t) => $this->serializeChecklistTemplate($t))->values()->all(),
        ]);
    }

    public function currentDraft(): JsonResponse
    {
        return response()->json([
            'data' => $this->serializeDraft($this->drafts->getCurrent()),
        ]);
    }

    public function saveDraft(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'payload' => ['required', 'array'],
        ]);

        $draft = $this->drafts->save($payload['payload']);

        return response()->json(['data' => $this->serializeDraft($draft)]);
    }

    public function deleteDraft(): JsonResponse
    {
        $this->drafts->clear();

        return response()->json(['ok' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'category' => ['required', Rule::enum(DirectTaskCategory::class)],
            'priority' => ['nullable', Rule::enum(DirectTaskPriority::class)],
            'taskType' => ['required', Rule::enum(DirectTaskType::class)],
            'scheduling' => ['nullable', 'array'],
            'scheduling.startDate' => ['nullable', 'date'],
            'scheduling.executionTime' => ['nullable', 'string', 'max:8'],
            'scheduling.dueAt' => ['nullable', 'date'],
            'scheduling.expectedDurationMinutes' => ['nullable', 'integer', 'min:1'],
            'scheduling.reminderMinutesBefore' => ['nullable', 'integer', 'min:0'],
            'scheduling.repeatEvery' => ['nullable', 'integer', 'min:1'],
            'scheduling.weekdays' => ['nullable', 'array'],
            'scheduling.weekdays.*' => ['integer', 'min:0', 'max:6'],
            'scheduling.monthDay' => ['nullable', 'integer', 'min:1', 'max:28'],
            'assignments' => ['nullable', 'array'],
            'assignments.*.type' => ['required_with:assignments', Rule::enum(DirectTaskAssignmentType::class)],
            'assignments.*.assigneeId' => ['required_with:assignments', 'integer'],
            'assignments.*.label' => ['nullable', 'string', 'max:255'],
            'checklist' => ['nullable', 'array'],
            'checklist.*.label' => ['required_with:checklist', 'string', 'max:255'],
            'checklist.*.itemType' => ['nullable', Rule::enum(DirectTaskChecklistItemType::class)],
            'checklist.*.isRequired' => ['nullable', 'boolean'],
            'checklist.*.sortOrder' => ['nullable', 'integer', 'min:0'],
            'options' => ['nullable', 'array'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'saveAsDraft' => ['nullable', 'boolean'],
        ]);
    }
}
