<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Enums\WorkflowInstanceStatus;
use App\Domain\Factory\Enums\WorkflowTaskStatus;
use App\Domain\Factory\Models\WorkflowInstance;
use App\Domain\Factory\Models\WorkflowTask;
use Illuminate\Support\Facades\DB;

class WorkflowDashboardService
{
    /**
     * @return array<string, mixed>
     */
    public function metrics(): array
    {
        $totalWorkflows = WorkflowInstance::query()->count();
        $activeWorkflows = WorkflowInstance::query()
            ->whereNotIn('status', [
                WorkflowInstanceStatus::Completed->value,
                WorkflowInstanceStatus::Cancelled->value,
                WorkflowInstanceStatus::Rejected->value,
            ])
            ->count();
        $completedWorkflows = WorkflowInstance::query()
            ->where('status', WorkflowInstanceStatus::Completed)
            ->count();
        $delayedWorkflows = WorkflowInstance::query()
            ->where('status', WorkflowInstanceStatus::Overdue)
            ->count();

        $openTasks = WorkflowTask::query()
            ->whereNotIn('status', [
                WorkflowTaskStatus::Completed->value,
                WorkflowTaskStatus::Cancelled->value,
            ])
            ->count();
        $closedTasks = WorkflowTask::query()
            ->where('status', WorkflowTaskStatus::Completed)
            ->count();

        $slaTotal = WorkflowTask::query()->whereNotNull('due_at')->count();
        $slaMet = WorkflowTask::query()
            ->where('status', WorkflowTaskStatus::Completed)
            ->where('is_overdue', false)
            ->count();
        $slaCompliance = $slaTotal > 0 ? round(($slaMet / $slaTotal) * 100, 1) : 100;

        $avgCompletion = WorkflowInstance::query()
            ->whereNotNull('completed_at')
            ->whereNotNull('started_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, started_at, completed_at)) as avg_minutes')
            ->value('avg_minutes');

        return [
            'totalWorkflows' => $totalWorkflows,
            'activeWorkflows' => $activeWorkflows,
            'completedWorkflows' => $completedWorkflows,
            'delayedWorkflows' => $delayedWorkflows,
            'openTasks' => $openTasks,
            'closedTasks' => $closedTasks,
            'slaCompliancePercent' => $slaCompliance,
            'averageCompletionMinutes' => $avgCompletion ? (int) round((float) $avgCompletion) : 0,
            'tasksByDepartment' => $this->tasksByDepartment(),
            'tasksByEmployee' => $this->tasksByEmployee(),
            'bottlenecks' => $this->bottlenecks(),
            'monthlyTrends' => $this->monthlyTrends(),
            'delayAnalysis' => $this->delayAnalysis(),
        ];
    }

    /**
     * @return list<array{department: string, count: int}>
     */
    private function tasksByDepartment(): array
    {
        return DB::table('workflow_tasks')
            ->join('employees', 'workflow_tasks.assigned_to', '=', 'employees.id')
            ->leftJoin('departments', 'employees.department_id', '=', 'departments.id')
            ->selectRaw('COALESCE(departments.name, ?) as department, COUNT(*) as count', ['غير محدد'])
            ->groupBy('departments.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['department' => $r->department, 'count' => (int) $r->count])
            ->all();
    }

    /**
     * @return list<array{employee: string, count: int}>
     */
    private function tasksByEmployee(): array
    {
        return DB::table('workflow_tasks')
            ->join('employees', 'workflow_tasks.assigned_to', '=', 'employees.id')
            ->selectRaw('COALESCE(employees.name, employees.first_name) as employee, COUNT(*) as count')
            ->groupBy('employees.id', 'employees.name', 'employees.first_name')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($r) => ['employee' => $r->employee, 'count' => (int) $r->count])
            ->all();
    }

    /**
     * @return list<array{stage: string, avgMinutes: int}>
     */
    private function bottlenecks(): array
    {
        return DB::table('workflow_tasks')
            ->join('workflow_stages', 'workflow_tasks.stage_id', '=', 'workflow_stages.id')
            ->where('workflow_tasks.status', WorkflowTaskStatus::Completed->value)
            ->whereNotNull('workflow_tasks.duration_minutes')
            ->selectRaw('workflow_stages.name as stage, AVG(workflow_tasks.duration_minutes) as avg_minutes')
            ->groupBy('workflow_stages.id', 'workflow_stages.name')
            ->orderByDesc('avg_minutes')
            ->limit(8)
            ->get()
            ->map(fn ($r) => ['stage' => $r->stage, 'avgMinutes' => (int) round((float) $r->avg_minutes)])
            ->all();
    }

    /**
     * @return list<array{month: string, started: int, completed: int}>
     */
    private function monthlyTrends(): array
    {
        $started = DB::table('workflow_instances')
            ->selectRaw("DATE_FORMAT(started_at, '%Y-%m') as month, COUNT(*) as cnt")
            ->whereNotNull('started_at')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('cnt', 'month');

        $completed = DB::table('workflow_instances')
            ->selectRaw("DATE_FORMAT(completed_at, '%Y-%m') as month, COUNT(*) as cnt")
            ->whereNotNull('completed_at')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('cnt', 'month');

        $months = $started->keys()->merge($completed->keys())->unique()->sort()->values();

        return $months->map(fn ($m) => [
            'month' => $m,
            'started' => (int) ($started[$m] ?? 0),
            'completed' => (int) ($completed[$m] ?? 0),
        ])->all();
    }

    /**
     * @return list<array{label: string, count: int}>
     */
    private function delayAnalysis(): array
    {
        $overdueTasks = WorkflowTask::query()->where('is_overdue', true)->count();
        $overdueInstances = WorkflowInstance::query()
            ->where('status', WorkflowInstanceStatus::Overdue)
            ->count();
        $waitingApproval = WorkflowInstance::query()
            ->where('status', WorkflowInstanceStatus::WaitingApproval)
            ->count();

        return [
            ['label' => 'مهام متأخرة', 'count' => $overdueTasks],
            ['label' => 'سير عمل متأخر', 'count' => $overdueInstances],
            ['label' => 'بانتظار الموافقة', 'count' => $waitingApproval],
        ];
    }
}
