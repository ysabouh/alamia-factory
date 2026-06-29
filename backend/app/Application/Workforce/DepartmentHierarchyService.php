<?php

namespace App\Application\Workforce;

use App\Domain\Factory\Models\Department;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class DepartmentHierarchyService
{
    public function isLeaf(Department $department): bool
    {
        return ! Department::query()
            ->where('parent_id', $department->id)
            ->where('is_active', true)
            ->exists();
    }

    public function wouldCreateCycle(int $departmentId, ?int $newParentId): bool
    {
        if ($newParentId === null || $newParentId === $departmentId) {
            return $newParentId === $departmentId;
        }

        $visited = [];
        $current = $newParentId;

        while ($current !== null) {
            if ($current === $departmentId) {
                return true;
            }
            if (isset($visited[$current])) {
                return false;
            }
            $visited[$current] = true;
            $current = Department::query()->whereKey($current)->value('parent_id');
        }

        return false;
    }

    /**
     * @return list<int>
     */
    public function ancestorIds(int $departmentId): array
    {
        $ids = [];
        $current = Department::query()->whereKey($departmentId)->value('parent_id');

        while ($current !== null) {
            $ids[] = (int) $current;
            $current = Department::query()->whereKey($current)->value('parent_id');
        }

        return $ids;
    }

    public function isInSameBranch(int $departmentId, int $otherDepartmentId): bool
    {
        if ($departmentId === $otherDepartmentId) {
            return true;
        }

        $aAncestors = $this->ancestorIds($departmentId);
        if (in_array($otherDepartmentId, $aAncestors, true)) {
            return true;
        }

        $bAncestors = $this->ancestorIds($otherDepartmentId);

        return in_array($departmentId, $bAncestors, true);
    }

    /**
     * @param  Collection<int, Department>  $departments
     * @return list<array<string, mixed>>
     */
    public function buildTree(Collection $departments, ?int $parentId = null): array
    {
        return $departments
            ->filter(fn (Department $d) => (int) ($d->parent_id ?? 0) === (int) ($parentId ?? 0))
            ->sortBy('code')
            ->map(function (Department $dept) use ($departments): array {
                return [
                    'department' => $dept,
                    'children' => $this->buildTree($departments, $dept->id),
                ];
            })
            ->values()
            ->all();
    }

    public function assertValidParent(Department $department, ?int $parentId): void
    {
        if ($parentId === null) {
            return;
        }

        if (! $department->exists) {
            return;
        }

        $departmentId = (int) $department->id;

        if ($parentId === $departmentId) {
            throw new InvalidArgumentException(__('factory.department_cannot_be_own_parent'));
        }

        if ($this->wouldCreateCycle($departmentId, $parentId)) {
            throw new InvalidArgumentException(__('factory.department_cycle_detected'));
        }
    }
}
