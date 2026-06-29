<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Enums\WorkflowAssignmentType;
use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\User;
use App\Domain\Factory\Models\WorkflowStage;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class WorkflowAssignmentResolver
{
    /**
     * @return Collection<int, array{employee_id: int, sequence_order: int}>
     */
    public function resolve(WorkflowStage $stage): Collection
    {
        $config = $stage->assignment_config ?? [];
        $type = $stage->assignment_type;

        return match ($type) {
            WorkflowAssignmentType::SingleEmployee => $this->singleEmployee($config),
            WorkflowAssignmentType::MultipleAny => $this->multipleEmployees($config),
            WorkflowAssignmentType::MultipleAll => $this->multipleEmployees($config),
            WorkflowAssignmentType::Sequential => $this->sequentialEmployees($config),
            WorkflowAssignmentType::Department => $this->departmentAssignment($config),
            WorkflowAssignmentType::Role => $this->roleAssignment($config),
        };
    }

    /**
     * @param  array<string, mixed>  $config
     * @return Collection<int, array{employee_id: int, sequence_order: int}>
     */
    private function singleEmployee(array $config): Collection
    {
        $employeeId = (int) ($config['employeeId'] ?? 0);
        if ($employeeId <= 0) {
            throw ValidationException::withMessages(['assignment' => ['يجب تحديد موظف للمرحلة.']]);
        }

        return collect([['employee_id' => $employeeId, 'sequence_order' => 0]]);
    }

    /**
     * @param  array<string, mixed>  $config
     * @return Collection<int, array{employee_id: int, sequence_order: int}>
     */
    private function multipleEmployees(array $config): Collection
    {
        $ids = $config['employeeIds'] ?? [];
        if (! is_array($ids) || count($ids) === 0) {
            throw ValidationException::withMessages(['assignment' => ['يجب تحديد موظفين للمرحلة.']]);
        }

        return collect($ids)->values()->map(fn ($id, $i) => [
            'employee_id' => (int) $id,
            'sequence_order' => $i,
        ]);
    }

    /**
     * @param  array<string, mixed>  $config
     * @return Collection<int, array{employee_id: int, sequence_order: int}>
     */
    private function sequentialEmployees(array $config): Collection
    {
        $all = $this->multipleEmployees($config);
        if ($all->count() > 0) {
            return collect([$all->first()]);
        }

        return $all;
    }

    /**
     * @param  array<string, mixed>  $config
     * @return Collection<int, array{employee_id: int, sequence_order: int}>
     */
    private function departmentAssignment(array $config): Collection
    {
        $departmentId = (int) ($config['departmentId'] ?? 0);
        $department = Department::query()->find($departmentId);
        if (! $department) {
            throw ValidationException::withMessages(['assignment' => ['القسم غير موجود.']]);
        }

        $managerId = $department->manager_id;
        if (! $managerId) {
            throw ValidationException::withMessages(['assignment' => ['القسم ليس له مدير معيّن.']]);
        }

        return collect([['employee_id' => (int) $managerId, 'sequence_order' => 0]]);
    }

    /**
     * @param  array<string, mixed>  $config
     * @return Collection<int, array{employee_id: int, sequence_order: int}>
     */
    private function roleAssignment(array $config): Collection
    {
        $jobRoleId = (int) ($config['jobRoleId'] ?? 0);
        $spatieRole = $config['spatieRole'] ?? null;

        $employeeIds = collect();

        if ($jobRoleId > 0) {
            $employeeIds = Employee::query()
                ->where('job_role_id', $jobRoleId)
                ->where('is_active', true)
                ->pluck('id');
        }

        if ($spatieRole) {
            $userEmployeeIds = User::query()
                ->role((string) $spatieRole)
                ->whereNotNull('employee_id')
                ->pluck('employee_id');
            $employeeIds = $employeeIds->merge($userEmployeeIds)->unique();
        }

        if ($employeeIds->isEmpty()) {
            throw ValidationException::withMessages(['assignment' => ['لا يوجد موظفون مطابقون للدور.']]);
        }

        return $employeeIds->values()->map(fn ($id, $i) => [
            'employee_id' => (int) $id,
            'sequence_order' => $i,
        ]);
    }

    public function nextSequentialAssignee(WorkflowStage $stage, int $currentSequenceOrder): ?int
    {
        $config = $stage->assignment_config ?? [];
        $ids = $config['employeeIds'] ?? [];
        if (! is_array($ids)) {
            return null;
        }

        $nextIndex = $currentSequenceOrder + 1;
        if (! isset($ids[$nextIndex])) {
            return null;
        }

        return (int) $ids[$nextIndex];
    }
}
