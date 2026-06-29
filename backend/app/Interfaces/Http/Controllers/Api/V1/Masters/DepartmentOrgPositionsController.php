<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Masters;

use App\Application\Workforce\DepartmentHierarchyService;
use App\Application\Workforce\EmployeeOrgPositionService;
use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\DepartmentOrgPosition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class DepartmentOrgPositionsController
{
    public function __construct(
        private readonly EmployeeOrgPositionService $orgPositionService,
        private readonly DepartmentHierarchyService $hierarchy,
    ) {}

    public function index(Department $department): JsonResponse
    {
        $positions = $department->orgPositions()
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get();

        return response()->json([
            'data' => $positions->map(fn (DepartmentOrgPosition $p) => $this->serialize($p))->values()->all(),
            'meta' => ['isLeaf' => $this->hierarchy->isLeaf($department)],
        ]);
    }

    public function store(Request $request, Department $department): JsonResponse
    {
        try {
            $this->orgPositionService->assertLeafDepartmentForPosition($department);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $data = $this->validated($request, $department->id);
        $position = $department->orgPositions()->create($data);

        return response()->json([
            'message' => __('factory.master_created'),
            'data' => $this->serialize($position),
        ], JsonResponse::HTTP_CREATED);
    }

    public function show(Department $department, DepartmentOrgPosition $orgPosition): JsonResponse
    {
        $this->assertBelongsToDepartment($department, $orgPosition);

        return response()->json($this->serialize($orgPosition));
    }

    public function update(Request $request, Department $department, DepartmentOrgPosition $orgPosition): JsonResponse
    {
        $this->assertBelongsToDepartment($department, $orgPosition);

        try {
            $this->orgPositionService->assertLeafDepartmentForPosition($department);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $data = $this->validated($request, $department->id, $orgPosition->id);
        $orgPosition->fill($data);
        $orgPosition->save();

        return response()->json([
            'message' => __('factory.master_updated'),
            'data' => $this->serialize($orgPosition->fresh()),
        ]);
    }

    public function destroy(Department $department, DepartmentOrgPosition $orgPosition): JsonResponse
    {
        $this->assertBelongsToDepartment($department, $orgPosition);

        if ($orgPosition->employees()->exists()) {
            return response()->json(['message' => __('factory.org_position_has_employees')], 422);
        }

        $orgPosition->delete();

        return response()->json(['message' => __('factory.master_deleted')]);
    }

    private function assertBelongsToDepartment(Department $department, DepartmentOrgPosition $position): void
    {
        if ((int) $position->department_id !== (int) $department->id) {
            abort(404);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, int $departmentId, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('department_org_positions', 'code')
                    ->where('department_id', $departmentId)
                    ->ignore($ignoreId),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'sortOrder' => ['sometimes', 'integer', 'min:0'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'plannedHeadcount' => ['sometimes', 'integer', 'min:0'],
            'planned_headcount' => ['sometimes', 'integer', 'min:0'],
            'vacancyCount' => ['sometimes', 'integer', 'min:0'],
            'vacancy_count' => ['sometimes', 'integer', 'min:0'],
            'isActive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $out = [
            'name' => $data['name'],
            'code' => strtoupper(trim($data['code'])),
            'description' => $data['description'] ?? null,
            'sort_order' => (int) ($data['sortOrder'] ?? $data['sort_order'] ?? 0),
            'planned_headcount' => (int) ($data['plannedHeadcount'] ?? $data['planned_headcount'] ?? 0),
            'vacancy_count' => (int) ($data['vacancyCount'] ?? $data['vacancy_count'] ?? 0),
            'is_active' => array_key_exists('isActive', $data) || array_key_exists('is_active', $data)
                ? $request->boolean('isActive', $request->boolean('is_active'))
                : true,
        ];

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(DepartmentOrgPosition $position): array
    {
        return [
            'id' => (string) $position->id,
            'departmentId' => (string) $position->department_id,
            'name' => $position->name,
            'code' => $position->code,
            'description' => $position->description,
            'sortOrder' => (int) $position->sort_order,
            'plannedHeadcount' => (int) $position->planned_headcount,
            'vacancyCount' => (int) $position->vacancy_count,
            'isActive' => (bool) $position->is_active,
            'createdAt' => $position->created_at?->toIso8601String(),
            'updatedAt' => $position->updated_at?->toIso8601String(),
        ];
    }
}
