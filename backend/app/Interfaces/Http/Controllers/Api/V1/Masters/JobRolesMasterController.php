<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Masters;

use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\JobRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class JobRolesMasterController
{
    public function __construct(
        private readonly MasterQuery $masterQuery
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = $this->masterQuery->apply($request, JobRole::query());
        $total = (clone $q)->count();
        $meta = $this->masterQuery->paginateMeta($request, $total);
        $rows = $q->orderBy('role_level')->orderBy('code')->forPage($meta['page'], $meta['pageSize'])->get();

        return response()->json([
            'data' => $rows->map(fn (JobRole $r) => $this->serialize($r))->values()->all(),
            'meta' => $meta,
        ]);
    }

    public function show(JobRole $jobRole): JsonResponse
    {
        return response()->json($this->serialize($jobRole));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $role = JobRole::create($data);

        return response()->json([
            'message' => __('factory.master_created'),
            'data' => $this->serialize($role),
        ], JsonResponse::HTTP_CREATED);
    }

    public function update(Request $request, JobRole $jobRole): JsonResponse
    {
        $data = $this->validated($request, $jobRole->id);
        $jobRole->fill($data);
        $jobRole->save();

        return response()->json([
            'message' => __('factory.master_updated'),
            'data' => $this->serialize($jobRole),
        ]);
    }

    public function activate(JobRole $jobRole): JsonResponse
    {
        $jobRole->is_active = true;
        $jobRole->save();

        return response()->json([
            'message' => __('factory.master_activated'),
            'data' => $this->serialize($jobRole),
        ]);
    }

    public function deactivate(JobRole $jobRole): JsonResponse
    {
        $jobRole->is_active = false;
        $jobRole->save();

        return response()->json([
            'message' => __('factory.master_deactivated'),
            'data' => $this->serialize($jobRole),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', Rule::unique('job_roles', 'code')->ignore($ignoreId)],
            'roleLevel' => ['required', 'integer', 'min:1', 'max:10'],
            'role_level' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'description' => ['nullable', 'string', 'max:5000'],
            'isActive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return [
            'name' => $data['name'],
            'code' => strtoupper(trim($data['code'])),
            'role_level' => (int) ($data['roleLevel'] ?? $data['role_level']),
            'description' => $data['description'] ?? null,
            'is_active' => array_key_exists('isActive', $data) || array_key_exists('is_active', $data)
                ? $request->boolean('isActive', $request->boolean('is_active'))
                : true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(JobRole $role): array
    {
        return [
            'id' => (string) $role->id,
            'name' => $role->name,
            'code' => $role->code,
            'roleLevel' => (int) $role->role_level,
            'description' => $role->description,
            'isActive' => (bool) ($role->is_active ?? true),
            'createdAt' => $role->created_at?->toIso8601String(),
            'updatedAt' => $role->updated_at?->toIso8601String(),
        ];
    }
}
