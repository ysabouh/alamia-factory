<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Workflow;

use App\Application\Workflow\WorkflowDesignerService;
use App\Application\Workflow\WorkflowTemplateService;
use App\Domain\Factory\Models\WorkflowTemplate;
use App\Domain\Factory\Models\WorkflowTemplateVersion;
use App\Interfaces\Http\Support\SerializesWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowTemplatesController
{
    use SerializesWorkflow;

    public function __construct(
        private readonly WorkflowTemplateService $templates,
        private readonly WorkflowDesignerService $designer,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = WorkflowTemplate::query()->with(['department', 'publishedVersion']);

        if ($request->filled('category')) {
            $q->where('category', $request->string('category'));
        }
        if ($request->filled('active')) {
            $q->where('is_active', filter_var($request->input('active'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($search = $request->string('search')->toString()) {
            $q->where(fn ($b) => $b->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
        }

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = min(100, max(1, (int) $request->input('pageSize', 20)));
        $total = (clone $q)->count();
        $rows = $q->orderBy('name')->forPage($page, $pageSize)->get();

        return response()->json([
            'data' => $rows->map(fn ($t) => $this->serializeTemplate($t))->values()->all(),
            'meta' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total],
        ]);
    }

    public function show(WorkflowTemplate $template): JsonResponse
    {
        $template->load([
            'department',
            'publishedVersion.stages.checklistItems',
            'publishedVersion.transitions',
            'versions.stages.checklistItems',
            'versions.transitions',
        ]);

        return response()->json($this->serializeTemplate($template));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:60'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:40'],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'isActive' => ['nullable', 'boolean'],
            'defaultPriority' => ['nullable', 'string', 'max:20'],
        ]);

        $template = $this->templates->create($data);

        return response()->json(
            $this->serializeTemplate($template->load(['versions.stages.checklistItems', 'publishedVersion', 'department'])),
            201
        );
    }

    public function update(Request $request, WorkflowTemplate $template): JsonResponse
    {
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:60'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'max:40'],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'isActive' => ['sometimes', 'boolean'],
            'defaultPriority' => ['sometimes', 'string', 'max:20'],
        ]);

        $template = $this->templates->update($template, $data);

        return response()->json($this->serializeTemplate($template));
    }

    public function clone(Request $request, WorkflowTemplate $template): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:60'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $clone = $this->templates->clone($template, $data['code'], $data['name']);

        return response()->json($this->serializeTemplate($clone), 201);
    }

    public function archive(WorkflowTemplate $template): JsonResponse
    {
        $template = $this->templates->archive($template);

        return response()->json($this->serializeTemplate($template));
    }

    public function createVersion(WorkflowTemplate $template): JsonResponse
    {
        $version = $this->templates->createDraftVersion($template);

        return response()->json($this->serializeVersion($version), 201);
    }

    public function showVersion(WorkflowTemplateVersion $version): JsonResponse
    {
        $version->load(['stages.checklistItems', 'transitions']);

        return response()->json($this->serializeVersion($version));
    }

    public function publishVersion(WorkflowTemplateVersion $version): JsonResponse
    {
        $version = $this->templates->publishVersion($version);

        return response()->json($this->serializeVersion($version));
    }

    public function saveDesigner(Request $request, WorkflowTemplateVersion $version): JsonResponse
    {
        $data = $request->validate([
            'nodes' => ['required', 'array'],
            'edges' => ['required', 'array'],
        ]);

        $version = $this->designer->saveGraph($version, $data);

        return response()->json($this->serializeVersion($version));
    }
}
