<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Workforce\EmployeeReportingService;
use App\Application\Workforce\EmployeeOrgPositionService;
use App\Application\Workforce\FactoryOrgSettingsService;
use App\Application\Workforce\OrgChartLayoutSettingsService;
use App\Application\Workforce\OrgChartService;
use App\Domain\Factory\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class OrgChartController
{
    public function __construct(
        private readonly OrgChartService $orgChart,
        private readonly EmployeeReportingService $reporting,
        private readonly OrgChartLayoutSettingsService $layoutSettings,
        private readonly FactoryOrgSettingsService $factorySettings,
        private readonly EmployeeOrgPositionService $orgPositionService,
    ) {}

    public function settings(): JsonResponse
    {
        $payload = $this->layoutSettings->get();

        return response()->json(['data' => $this->serializeLayoutPayload($payload)]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'layoutMode' => ['sometimes', 'string', 'in:auto,manual'],
            'direction' => ['sometimes', 'string', 'in:TB,LR'],
            'nodeSep' => ['sometimes', 'integer', 'min:10', 'max:200'],
            'rankSep' => ['sometimes', 'integer', 'min:20', 'max:300'],
            'edgeType' => ['sometimes', 'string', 'in:smoothstep,step,straight'],
            'reparentOnDrag' => ['sometimes', 'boolean'],
            'departmentColors' => ['sometimes', 'array'],
            'departmentColors.*' => ['nullable', 'string', 'max:20'],
        ]);

        $payload = $this->layoutSettings->updateSettings($data);

        return response()->json(['data' => $this->serializeLayoutPayload($payload)]);
    }

    public function updatePositions(Request $request): JsonResponse
    {
        $data = $request->validate([
            'positions' => ['required', 'array'],
            'positions.*.x' => ['required', 'numeric'],
            'positions.*.y' => ['required', 'numeric'],
        ]);

        $payload = $this->layoutSettings->mergePositions($data['positions']);

        return response()->json(['data' => $this->serializeLayoutPayload($payload)]);
    }

    public function resetPositions(): JsonResponse
    {
        $payload = $this->layoutSettings->resetPositions();

        return response()->json(['data' => $this->serializeLayoutPayload($payload)]);
    }

    /**
     * @param  array{settings: array<string, mixed>, positions: array<string, array{x: float, y: float}>}  $payload
     * @return array<string, mixed>
     */
    private function serializeLayoutPayload(array $payload): array
    {
        return [
            'settings' => $payload['settings'],
            'positions' => $payload['positions'],
        ];
    }

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->orgChart->build()]);
    }

    public function factorySettings(): JsonResponse
    {
        return response()->json(['data' => $this->factorySettings->get()]);
    }

    public function updateFactorySettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'generalManagerEmployeeId' => ['nullable', 'integer', 'exists:employees,id'],
            'general_manager_employee_id' => ['nullable', 'integer', 'exists:employees,id'],
        ]);

        $payload = [];
        if (array_key_exists('title', $data)) {
            $payload['title'] = $data['title'];
        }
        $gm = $data['generalManagerEmployeeId'] ?? $data['general_manager_employee_id'] ?? null;
        if (array_key_exists('generalManagerEmployeeId', $data) || array_key_exists('general_manager_employee_id', $data)) {
            $payload['generalManagerEmployeeId'] = $gm;
        }

        return response()->json(['data' => $this->factorySettings->update($payload)]);
    }

    public function updateReporting(Request $request, Employee $employee): JsonResponse
    {
        $data = $request->validate([
            'reportsToId' => ['nullable', 'integer', 'exists:employees,id'],
            'reports_to_id' => ['nullable', 'integer', 'exists:employees,id'],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'orgPositionId' => ['nullable', 'integer', 'exists:department_org_positions,id'],
            'org_position_id' => ['nullable', 'integer', 'exists:department_org_positions,id'],
        ]);

        $reportsToId = $data['reportsToId'] ?? $data['reports_to_id'] ?? null;
        $departmentId = $data['departmentId'] ?? $data['department_id'] ?? null;
        $orgPositionId = array_key_exists('orgPositionId', $data) || array_key_exists('org_position_id', $data)
            ? ($data['orgPositionId'] ?? $data['org_position_id'] ?? null)
            : null;
        $updateOrgPosition = array_key_exists('orgPositionId', $data) || array_key_exists('org_position_id', $data);

        $deptId = $departmentId !== null ? (int) $departmentId : $employee->department_id;
        if ($updateOrgPosition) {
            try {
                $this->orgPositionService->assertPositionForEmployee(
                    $orgPositionId !== null ? (int) $orgPositionId : null,
                    $deptId !== null ? (int) $deptId : null,
                );
            } catch (InvalidArgumentException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }

        try {
            $updated = $this->reporting->updateReporting(
                $employee,
                $reportsToId !== null ? (int) $reportsToId : null,
                $departmentId !== null ? (int) $departmentId : null,
                $orgPositionId !== null ? (int) $orgPositionId : null,
                $updateOrgPosition,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'data' => [
                'id' => (string) $updated->id,
                'reportsToId' => $updated->reports_to_id ? (string) $updated->reports_to_id : null,
                'departmentId' => $updated->department_id ? (string) $updated->department_id : null,
                'orgPositionId' => $updated->org_position_id ? (string) $updated->org_position_id : null,
            ],
        ]);
    }
}
