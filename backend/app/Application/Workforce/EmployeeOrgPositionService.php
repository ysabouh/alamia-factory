<?php

namespace App\Application\Workforce;

use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\DepartmentOrgPosition;
use InvalidArgumentException;

class EmployeeOrgPositionService
{
    public function __construct(
        private readonly DepartmentHierarchyService $hierarchy,
    ) {}

    public function assertPositionForEmployee(?int $orgPositionId, ?int $departmentId): void
    {
        if ($orgPositionId === null) {
            return;
        }

        if ($departmentId === null) {
            throw new InvalidArgumentException(__('factory.org_position_requires_department'));
        }

        $position = DepartmentOrgPosition::query()->findOrFail($orgPositionId);

        if ((int) $position->department_id !== (int) $departmentId) {
            throw new InvalidArgumentException(__('factory.org_position_department_mismatch'));
        }

        $dept = Department::query()->findOrFail($departmentId);
        if (! $this->hierarchy->isLeaf($dept)) {
            throw new InvalidArgumentException(__('factory.org_position_leaf_only'));
        }
    }

    public function assertLeafDepartmentForPosition(Department $department): void
    {
        if (! $this->hierarchy->isLeaf($department)) {
            throw new InvalidArgumentException(__('factory.org_position_leaf_only'));
        }
    }
}
