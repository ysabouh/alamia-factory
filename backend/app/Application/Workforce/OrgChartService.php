<?php

namespace App\Application\Workforce;

use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\DepartmentOrgPosition;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\MachineAssignment;
use Illuminate\Support\Collection;

class OrgChartService
{
    private const SUPERVISOR_ROLE_LEVEL = 7;

    public function __construct(
        private readonly DepartmentHierarchyService $hierarchy,
        private readonly FactoryOrgSettingsService $factorySettings,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(): array
    {
        $employees = $this->loadEmployees();
        $employeesById = $employees->keyBy(fn (Employee $e) => (int) $e->id);
        $settings = $this->factorySettings->row();
        $settings->load('generalManager.jobRole');

        $departments = Department::query()
            ->with(['manager.jobRole', 'orgPositions' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')->orderBy('code')])
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        $employeesByDept = $employees->groupBy(fn (Employee $e) => (int) ($e->department_id ?? 0));
        $treeBranches = $this->hierarchy->buildTree($departments, null);

        $departmentTree = array_map(
            fn (array $branch) => $this->serializeDepartmentNode($branch, $employeesByDept, $employeesById),
            $treeBranches
        );

        $gm = $settings->generalManager;
        $factoryRoot = [
            'type' => 'factory_root',
            'id' => 'factory-root',
            'title' => $settings->title,
            'generalManagerEmployee' => $gm ? $this->serializeEmployeeNode($gm) : null,
        ];

        $reportingEdges = $employees
            ->filter(fn (Employee $e) => $e->reports_to_id !== null)
            ->map(fn (Employee $e) => [
                'from' => (string) $e->reports_to_id,
                'to' => (string) $e->id,
            ])
            ->values()
            ->all();

        return [
            'factoryRoot' => $factoryRoot,
            'departmentTree' => $departmentTree,
            'employees' => $employees->map(fn (Employee $e) => $this->serializeEmployeeNode($e))->values()->all(),
            'reportingEdges' => $reportingEdges,
            // Legacy flat list for backward compatibility during transition
            'departments' => $this->flattenDepartmentTree($departmentTree),
            'virtualRoot' => $gm === null,
            'root' => $gm
                ? $this->serializeEmployeeNode($gm)
                : ['type' => 'virtual_root', 'id' => 'virtual-gm', 'name' => $settings->title, 'children' => []],
        ];
    }

    /**
     * @param  array{department: Department, children: list<array{department: Department, children: mixed}>}  $branch
     * @param  Collection<int|string, Collection<int, Employee>>  $employeesByDept
     * @param  Collection<int, Employee>  $employeesById
     * @return array<string, mixed>
     */
    private function serializeDepartmentNode(array $branch, Collection $employeesByDept, Collection $employeesById): array
    {
        /** @var Department $dept */
        $dept = $branch['department'];
        $deptEmployees = $employeesByDept->get($dept->id, collect());
        $managerId = $dept->manager_id !== null ? (int) $dept->manager_id : null;
        $managerEmployee = $managerId !== null ? $employeesById->get($managerId) : null;
        $statsEmployees = $this->departmentEmployeesForStats($deptEmployees, $managerEmployee);
        $isLeaf = $this->hierarchy->isLeaf($dept);

        $childDepts = array_map(
            fn (array $child) => $this->serializeDepartmentNode($child, $employeesByDept, $employeesById),
            $branch['children']
        );

        $node = [
            'type' => 'department',
            'id' => 'dept-'.$dept->id,
            'departmentId' => (string) $dept->id,
            'parentId' => $dept->parent_id ? (string) $dept->parent_id : null,
            'name' => $dept->name,
            'code' => $dept->code,
            'managerId' => $dept->manager_id ? (string) $dept->manager_id : null,
            'managerEmployee' => null,
            'isLeaf' => $isLeaf,
            'stats' => [
                'employeeCount' => 0,
                'supervisorCount' => 0,
                'vacancyCount' => 0,
                'activeCount' => 0,
            ],
            'children' => $childDepts,
            'positions' => [],
            'directEmployees' => [],
        ];

        $staffEmployees = $managerId !== null
            ? $deptEmployees->filter(fn (Employee $e) => (int) $e->id !== $managerId)
            : $deptEmployees;

        if ($managerEmployee !== null) {
            $node['managerEmployee'] = $this->serializeEmployeeNode($managerEmployee);
        }

        if ($isLeaf) {
            $byPosition = $staffEmployees->groupBy(fn (Employee $e) => $e->org_position_id ?? 'unassigned');
            $positions = [];
            foreach ($dept->orgPositions as $position) {
                $posEmployees = $byPosition->get($position->id, collect());
                $positions[] = [
                    'type' => 'org_position',
                    'id' => 'pos-'.$position->id,
                    'positionId' => (string) $position->id,
                    'name' => $position->name,
                    'code' => $position->code,
                    'vacancyCount' => $this->positionVacancyCount($position, $posEmployees->count()),
                    'performanceScore' => $this->averagePerformanceScore($posEmployees),
                    'employees' => $posEmployees->map(fn (Employee $e) => $this->serializeEmployeeNode($e))->values()->all(),
                ];
            }
            $unassigned = $byPosition->get('unassigned', collect());
            $node['positions'] = $positions;
            $node['directEmployees'] = $unassigned->map(fn (Employee $e) => $this->serializeEmployeeNode($e))->values()->all();
            $node['stats'] = $this->leafDepartmentStats($dept, $node, $statsEmployees, $employeesById);
        } else {
            $node['directEmployees'] = $staffEmployees->map(fn (Employee $e) => $this->serializeEmployeeNode($e))->values()->all();
            $node['stats'] = $this->parentDepartmentStats($dept, $node, $childDepts, $employeesById);
        }

        return $node;
    }

    /**
     * @param  list<array<string, mixed>>  $tree
     * @return list<array<string, mixed>>
     */
    private function flattenDepartmentTree(array $tree): array
    {
        $out = [];
        foreach ($tree as $node) {
            $empChildren = [];
            foreach ($node['positions'] ?? [] as $pos) {
                foreach ($pos['employees'] ?? [] as $emp) {
                    $empChildren[] = $emp;
                }
            }
            foreach ($node['directEmployees'] ?? [] as $emp) {
                $empChildren[] = $emp;
            }
            $flat = $node;
            if (! empty($node['managerEmployee'])) {
                $empChildren[] = $node['managerEmployee'];
            }
            $flat['children'] = $empChildren;
            $out[] = $flat;
            $out = array_merge($out, $this->flattenDepartmentTree($node['children'] ?? []));
        }

        return $out;
    }

    /**
     * @return Collection<int, Employee>
     */
    private function loadEmployees(): Collection
    {
        return Employee::query()
            ->with([
                'organizationalDepartment',
                'orgPosition',
                'jobRole',
                'employmentStatus',
                'shift',
                'hall',
                'reportsTo',
                'certifications',
                'operatorAssignments' => fn ($q) => $q->whereNull('ended_at')->with('machine'),
                'technicianAssignments' => fn ($q) => $q->whereNull('ended_at')->with('machine'),
                'workOrderAssignments' => fn ($q) => $q->whereNull('deleted_at')->with('workOrder.machine'),
            ])
            ->orderBy('employee_number')
            ->get();
    }

    /**
     * @param  Collection<int, Employee>  $deptEmployees
     * @return Collection<int, Employee>
     */
    private function departmentEmployeesForStats(Collection $deptEmployees, ?Employee $managerEmployee): Collection
    {
        if ($managerEmployee === null) {
            return $deptEmployees;
        }

        if ($deptEmployees->contains(fn (Employee $e) => (int) $e->id === (int) $managerEmployee->id)) {
            return $deptEmployees;
        }

        return $deptEmployees->concat([$managerEmployee]);
    }

    /**
     * @param  array<string, mixed>  $node
     * @param  Collection<int, Employee>  $deptEmployees
     * @param  Collection<int, Employee>  $employeesById
     * @return array<string, int|float>
     */
    private function leafDepartmentStats(
        Department $dept,
        array $node,
        Collection $deptEmployees,
        Collection $employeesById
    ): array {
        $positionVacancies = array_sum(array_map(
            fn (array $pos) => (int) ($pos['vacancyCount'] ?? 0),
            $node['positions'] ?? []
        ));
        $unassignedCount = count($node['directEmployees'] ?? []);
        $deptLevelVacancy = $unassignedCount === 0 ? (int) ($dept->vacancy_count ?? 0) : 0;
        $rollupNode = array_merge($node, ['children' => []]);
        $employeeIds = $this->collectEmployeeIdsFromNode($rollupNode);

        $stats = $this->departmentStats($deptEmployees, $positionVacancies + $deptLevelVacancy);
        $stats['employeeCount'] = count($employeeIds);
        $stats['activeCount'] = $this->countActiveEmployeesByIds($employeeIds, $employeesById);

        return $stats;
    }

    /**
     * @param  array<string, mixed>  $node
     * @param  list<array<string, mixed>>  $childDepts
     * @param  Collection<int, Employee>  $employeesById
     * @return array<string, int|float>
     */
    private function parentDepartmentStats(
        Department $dept,
        array $node,
        array $childDepts,
        Collection $employeesById
    ): array {
        $employeeIds = $this->collectEmployeeIdsFromNode($node);
        $childVacancies = array_sum(array_map(
            fn (array $child) => (int) ($child['stats']['vacancyCount'] ?? 0),
            $childDepts
        ));
        $ownVacancy = count($employeeIds) === 0 ? (int) ($dept->vacancy_count ?? 0) : 0;

        $supervisors = 0;
        foreach ($employeeIds as $id) {
            $employee = $employeesById->get((int) $id);
            if ($employee === null) {
                continue;
            }
            $hasReports = collect($employeeIds)->contains(function (string $otherId) use ($employee, $employeesById) {
                $other = $employeesById->get((int) $otherId);

                return $other !== null && (int) $other->reports_to_id === (int) $employee->id;
            });
            if ($hasReports || (int) ($employee->jobRole?->role_level ?? 0) >= self::SUPERVISOR_ROLE_LEVEL) {
                $supervisors++;
            }
        }

        return [
            'employeeCount' => count($employeeIds),
            'supervisorCount' => $supervisors,
            'vacancyCount' => $childVacancies + $ownVacancy,
            'activeCount' => $this->countActiveEmployeesByIds($employeeIds, $employeesById),
        ];
    }

    /**
     * @param  list<string>  $employeeIds
     * @param  Collection<int, Employee>  $employeesById
     */
    private function countActiveEmployeesByIds(array $employeeIds, Collection $employeesById): int
    {
        $count = 0;
        foreach ($employeeIds as $id) {
            if ($employeesById->get((int) $id)?->is_active) {
                $count++;
            }
        }

        return $count;
    }

    private function positionVacancyCount(DepartmentOrgPosition $position, int $filledCount): int
    {
        $planned = (int) $position->planned_headcount;
        if ($planned > 0) {
            return max(0, $planned - $filledCount);
        }

        return max(0, (int) $position->vacancy_count);
    }

    /**
     * @param  Collection<int, Employee>  $employees
     */
    private function averagePerformanceScore(Collection $employees): ?float
    {
        if ($employees->isEmpty()) {
            return null;
        }

        $avg = $employees->avg(fn (Employee $e) => (float) ($e->performance_score ?? 0));

        return round((float) $avg, 1);
    }

    /**
     * @param  array<string, mixed>  $node
     * @return list<string>
     */
    private function collectEmployeeIdsFromNode(array $node): array
    {
        $ids = [];
        if (! empty($node['managerEmployee']['id'])) {
            $ids[] = (string) $node['managerEmployee']['id'];
        }
        foreach ($node['directEmployees'] ?? [] as $employee) {
            $ids[] = (string) $employee['id'];
        }
        foreach ($node['positions'] ?? [] as $position) {
            foreach ($position['employees'] ?? [] as $employee) {
                $ids[] = (string) $employee['id'];
            }
        }
        foreach ($node['children'] ?? [] as $child) {
            $ids = array_merge($ids, $this->collectEmployeeIdsFromNode($child));
        }

        return array_values(array_unique($ids));
    }

    /**
     * @param  Collection<int, Employee>  $deptEmployees
     * @return array<string, int>
     */
    private function departmentStats(Collection $deptEmployees, int $vacancyCount): array
    {
        $active = $deptEmployees->filter(fn (Employee $e) => $e->is_active);
        $supervisors = $deptEmployees->filter(function (Employee $e) use ($deptEmployees): bool {
            $hasReports = $deptEmployees->contains(fn (Employee $r) => (int) $r->reports_to_id === (int) $e->id);

            return $hasReports || (int) ($e->jobRole?->role_level ?? 0) >= self::SUPERVISOR_ROLE_LEVEL;
        });

        return [
            'employeeCount' => $deptEmployees->count(),
            'supervisorCount' => $supervisors->count(),
            'vacancyCount' => $vacancyCount,
            'activeCount' => $active->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeEmployeeNode(Employee $e): array
    {
        $assignment = $this->activeMachineAssignment($e);
        $machine = $assignment?->machine;
        $activeWo = $e->workOrderAssignments
            ->first(fn ($w) => $w->deleted_at === null);

        return [
            'type' => 'employee',
            'id' => (string) $e->id,
            'employeeNumber' => (string) ($e->employee_number ?? $e->code),
            'fullName' => $e->full_name,
            'profileImage' => $e->profile_image,
            'position' => $e->jobRole?->name ?? $e->job_title,
            'positionCode' => $e->jobRole?->code,
            'orgPositionId' => $e->org_position_id ? (string) $e->org_position_id : null,
            'orgPositionName' => $e->orgPosition?->name,
            'orgPositionCode' => $e->orgPosition?->code,
            'roleLevel' => (int) ($e->jobRole?->role_level ?? 0),
            'departmentId' => $e->department_id ? (string) $e->department_id : null,
            'departmentName' => $e->organizationalDepartment?->name ?? $e->department,
            'departmentCode' => $e->organizationalDepartment?->code,
            'reportsToId' => $e->reports_to_id ? (string) $e->reports_to_id : null,
            'managerName' => $e->reportsTo?->full_name,
            'isActive' => (bool) $e->is_active,
            'employmentStatus' => $e->employmentStatus ? [
                'code' => $e->employmentStatus->code,
                'name' => $e->employmentStatus->name,
            ] : null,
            'currentShift' => $e->shift?->name,
            'assignedMachine' => $machine?->name ?? $machine?->code,
            'productionLine' => $machine?->production_line ?? $e->hall?->name,
            'activeWorkOrderNo' => $activeWo?->workOrder?->order_no ?? $activeWo?->workOrder?->code,
            'performanceScore' => $e->performance_score !== null ? round((float) $e->performance_score, 1) : null,
            'certifications' => $e->certifications->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->name,
                'issuer' => $c->issuer,
                'issuedAt' => $c->issued_at?->toDateString(),
                'expiresAt' => $c->expires_at?->toDateString(),
            ])->values()->all(),
            'children' => [],
        ];
    }

    private function activeMachineAssignment(Employee $e): ?MachineAssignment
    {
        $op = $e->operatorAssignments->first();
        if ($op) {
            return $op;
        }

        return $e->technicianAssignments->first();
    }
}
