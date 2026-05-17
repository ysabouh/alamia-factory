<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Masters;

use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartmentsMasterController
{
    public function __construct(
        private readonly MasterQuery $masterQuery
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = $this->masterQuery->apply($request, Department::query()->with('hall:id,name,code'));
        $total = (clone $q)->count();
        $meta = $this->masterQuery->paginateMeta($request, $total);
        $rows = $q->orderBy('code')->forPage($meta['page'], $meta['pageSize'])->get();

        return response()->json([
            'data' => $rows->map(fn (Department $d) => $this->serialize($d))->values()->all(),
            'meta' => $meta,
        ]);
    }

    public function show(Department $department): JsonResponse
    {
        $department->load('hall:id,name,code');

        return response()->json($this->serialize($department));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $department = Department::create($data);
        $department->load('hall:id,name,code');

        return response()->json([
            'message' => __('factory.master_created'),
            'data' => $this->serialize($department),
        ], JsonResponse::HTTP_CREATED);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $data = $this->validated($request, $department->id);
        $department->fill($data);
        $department->save();
        $department->load('hall:id,name,code');

        return response()->json([
            'message' => __('factory.master_updated'),
            'data' => $this->serialize($department),
        ]);
    }

    public function activate(Department $department): JsonResponse
    {
        $department->is_active = true;
        $department->save();
        $department->load('hall:id,name,code');

        return response()->json([
            'message' => __('factory.master_activated'),
            'data' => $this->serialize($department),
        ]);
    }

    public function deactivate(Department $department): JsonResponse
    {
        $department->is_active = false;
        $department->save();
        $department->load('hall:id,name,code');

        return response()->json([
            'message' => __('factory.master_deactivated'),
            'data' => $this->serialize($department),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', Rule::unique('departments', 'code')->ignore($ignoreId)],
            'hallId' => ['required', 'integer', 'exists:halls,id'],
            'hall_id' => ['sometimes', 'integer', 'exists:halls,id'],
            'description' => ['nullable', 'string', 'max:5000'],
            'isActive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return [
            'name' => $data['name'],
            'code' => strtoupper(trim($data['code'])),
            'hall_id' => (int) ($data['hallId'] ?? $data['hall_id']),
            'description' => $data['description'] ?? null,
            'is_active' => array_key_exists('isActive', $data) || array_key_exists('is_active', $data)
                ? $request->boolean('isActive', $request->boolean('is_active'))
                : true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Department $department): array
    {
        $hall = $department->hall;

        return [
            'id' => (string) $department->id,
            'name' => $department->name,
            'code' => $department->code,
            'hallId' => $department->hall_id !== null ? (string) $department->hall_id : null,
            'hallName' => $hall?->name,
            'hallCode' => $hall?->code,
            'description' => $department->description,
            'isActive' => (bool) $department->is_active,
            'createdAt' => $department->created_at?->toIso8601String(),
            'updatedAt' => $department->updated_at?->toIso8601String(),
        ];
    }
}
