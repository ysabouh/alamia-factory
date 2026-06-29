<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\JobRole;

class WorkflowAssignmentLabelService
{
    /**
     * @param  array<string, mixed>  $config
     * @return list<string>
     */
    public function resolveAssigneeNames(string $assignmentType, array $config): array
    {
        return match ($assignmentType) {
            'single_employee' => $this->employeeNames(isset($config['employeeId']) ? [(int) $config['employeeId']] : []),
            'multiple_any', 'multiple_all', 'sequential' => $this->employeeNames(
                is_array($config['employeeIds'] ?? null)
                    ? array_map('intval', $config['employeeIds'])
                    : []
            ),
            'department' => $this->departmentLabel(isset($config['departmentId']) ? (int) $config['departmentId'] : 0),
            'role' => $this->roleNames($config),
            default => [],
        };
    }

    /**
     * @param  array{nodes?: array<int, array<string, mixed>>, edges?: array<int, mixed>}  $graph
     * @return array{nodes?: array<int, array<string, mixed>>, edges?: array<int, mixed>}
     */
    public function enrichGraphWithAssigneeNames(array $graph): array
    {
        if (! isset($graph['nodes']) || ! is_array($graph['nodes'])) {
            return $graph;
        }

        $graph['nodes'] = array_map(function (array $node): array {
            if (($node['type'] ?? '') === 'workflowGateway') {
                return $node;
            }

            $data = $node['data'] ?? [];
            if (! is_array($data)) {
                return $node;
            }

            $assignmentType = (string) ($data['assignmentType'] ?? 'single_employee');
            $config = is_array($data['assignmentConfig'] ?? null) ? $data['assignmentConfig'] : [];

            if ($assignmentType === 'department' && ! empty($config['departmentId'])) {
                $department = Department::query()->with('manager')->find((int) $config['departmentId']);
                if ($department) {
                    $data['assigneeNames'] = [(string) $department->name];
                    if ($department->manager) {
                        $data['assigneeSubtitle'] = 'المدير: '.$this->employeeDisplayName($department->manager);
                    }
                    $node['data'] = $data;
                }

                return $node;
            }

            $names = $this->resolveAssigneeNames($assignmentType, $config);

            if ($names !== []) {
                $data['assigneeNames'] = $names;
                $node['data'] = $data;
            }

            return $node;
        }, $graph['nodes']);

        return $graph;
    }

    public function employeeDisplayName(Employee $employee): string
    {
        $first = trim((string) ($employee->first_name ?? ''));
        $last = trim((string) ($employee->last_name ?? ''));
        $full = trim($first.' '.$last);

        if ($full !== '') {
            return $full;
        }

        $name = trim((string) ($employee->name ?? ''));

        return $name !== '' ? $name : 'موظف #'.$employee->id;
    }

    /**
     * @param  list<int>  $ids
     * @return list<string>
     */
    private function employeeNames(array $ids): array
    {
        $ids = array_values(array_filter(array_map('intval', $ids), fn (int $id): bool => $id > 0));
        if ($ids === []) {
            return [];
        }

        $employees = Employee::query()->whereIn('id', $ids)->get()->keyBy('id');

        return array_values(array_filter(array_map(
            fn (int $id): ?string => isset($employees[$id]) ? $this->employeeDisplayName($employees[$id]) : null,
            $ids
        )));
    }

    /**
     * @return list<string>
     */
    private function departmentLabel(int $departmentId): array
    {
        if ($departmentId <= 0) {
            return [];
        }

        $department = Department::query()->find($departmentId);

        return $department ? [(string) $department->name] : [];
    }

    /**
     * @param  array<string, mixed>  $config
     * @return list<string>
     */
    private function roleNames(array $config): array
    {
        if (! empty($config['jobRoleId'])) {
            $role = JobRole::query()->find((int) $config['jobRoleId']);

            return $role ? [(string) $role->name] : [];
        }

        if (! empty($config['spatieRole']) && is_string($config['spatieRole'])) {
            return [trim($config['spatieRole'])];
        }

        return [];
    }
}
