<?php

namespace App\Application\Workforce;

use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\MachineAssignment;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class EmployeeReportingService
{
    public function __construct(
        private readonly DepartmentHierarchyService $hierarchy,
    ) {}

    public function updateReporting(
        Employee $employee,
        ?int $reportsToId,
        ?int $departmentId = null,
        ?int $orgPositionId = null,
        bool $updateOrgPosition = false,
    ): Employee {
        if ($reportsToId !== null) {
            if ($reportsToId === $employee->id) {
                throw new InvalidArgumentException(__('factory.org_chart_cannot_report_to_self'));
            }
            if ($this->wouldCreateCycle($employee->id, $reportsToId)) {
                throw new InvalidArgumentException(__('factory.org_chart_cycle_detected'));
            }
            $manager = Employee::query()->findOrFail($reportsToId);
            $empDeptId = $departmentId ?? $employee->department_id;
            if ($empDeptId !== null && $manager->department_id !== null) {
                if (! $this->hierarchy->isInSameBranch((int) $empDeptId, (int) $manager->department_id)) {
                    throw new InvalidArgumentException(__('factory.org_chart_reporting_branch_mismatch'));
                }
            }
        }

        $employee->reports_to_id = $reportsToId;
        if ($departmentId !== null) {
            $employee->department_id = $departmentId;
        }
        if ($updateOrgPosition) {
            $employee->org_position_id = $orgPositionId;
        }
        $employee->save();

        return $employee->fresh([
            'organizationalDepartment',
            'orgPosition',
            'jobRole',
            'employmentStatus',
            'shift',
            'reportsTo',
        ]);
    }

    public function wouldCreateCycle(int $employeeId, int $newManagerId): bool
    {
        $visited = [];
        $current = $newManagerId;

        while ($current !== null) {
            if ($current === $employeeId) {
                return true;
            }
            if (isset($visited[$current])) {
                return false;
            }
            $visited[$current] = true;
            $current = Employee::query()->whereKey($current)->value('reports_to_id');
        }

        return false;
    }
}
