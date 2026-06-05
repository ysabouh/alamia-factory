<?php

namespace App\Application\Production;

use App\Domain\Factory\Enums\InspectionStatus;
use App\Domain\Factory\Enums\WorkOrderStatus;
use App\Domain\Factory\Models\MachineDowntime;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Domain\Factory\Models\ProductionLog;
use App\Domain\Factory\Models\QualityInspection;
use App\Domain\Factory\Models\QualityInspectionDefect;
use App\Domain\Factory\Models\WorkOrder;
use App\Domain\Factory\Models\WorkOrderWorker;
use Illuminate\Support\Facades\DB;

class ProductionDashboardService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function kpis(array $filters = []): array
    {
        $from = $filters['from'] ?? now()->subDays(7)->toDateString();
        $to = $filters['to'] ?? now()->toDateString();

        $orderQuery = WorkOrder::query()->whereBetween('production_date', [$from, $to]);
        if (! empty($filters['machineId'])) {
            $orderQuery->where('machine_id', (int) $filters['machineId']);
        }
        if (! empty($filters['shiftId'])) {
            $orderQuery->where('shift_id', (int) $filters['shiftId']);
        }

        $orderIds = (clone $orderQuery)->pluck('id');

        $dailyProduction = ProductionLog::query()
            ->whereIn('work_order_id', $orderIds)
            ->selectRaw('DATE(from_time) as log_date, SUM(good_quantity) as good_qty, SUM(scrap_quantity) as scrap_qty')
            ->groupBy('log_date')
            ->orderBy('log_date')
            ->get()
            ->map(fn ($r) => [
                'date' => $r->log_date,
                'goodQuantity' => (int) $r->good_qty,
                'scrapQuantity' => (int) $r->scrap_qty,
            ])
            ->values()
            ->all();

        $byMachine = ProductionLog::query()
            ->join('work_orders', 'work_orders.id', '=', 'production_logs.work_order_id')
            ->join('machines', 'machines.id', '=', 'work_orders.machine_id')
            ->whereIn('production_logs.work_order_id', $orderIds)
            ->selectRaw('machines.id as machine_id, machines.code as machine_code, SUM(production_logs.good_quantity) as good_qty')
            ->groupBy('machines.id', 'machines.code')
            ->get()
            ->map(fn ($r) => [
                'machineId' => (string) $r->machine_id,
                'machineCode' => $r->machine_code,
                'goodQuantity' => (int) $r->good_qty,
            ])
            ->values()
            ->all();

        $inspectionStats = QualityInspection::query()
            ->whereIn('work_order_id', $orderIds)
            ->selectRaw('status, COUNT(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $totalInspections = (int) $inspectionStats->sum();
        $passed = (int) ($inspectionStats[InspectionStatus::Passed->value] ?? 0);
        $failed = (int) ($inspectionStats[InspectionStatus::Failed->value] ?? 0);

        $topDefects = QualityInspectionDefect::query()
            ->join('quality_defects', 'quality_defects.id', '=', 'quality_inspection_defects.defect_id')
            ->join('quality_inspections', 'quality_inspections.id', '=', 'quality_inspection_defects.quality_inspection_id')
            ->whereIn('quality_inspections.work_order_id', $orderIds)
            ->selectRaw('quality_defects.code, quality_defects.name, SUM(quality_inspection_defects.quantity) as total_qty')
            ->groupBy('quality_defects.id', 'quality_defects.code', 'quality_defects.name')
            ->orderByDesc('total_qty')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'code' => $r->code,
                'name' => $r->name,
                'quantity' => (int) $r->total_qty,
            ])
            ->values()
            ->all();

        $downtimeStats = MachineDowntime::query()
            ->whereIn('work_order_id', $orderIds)
            ->selectRaw('COUNT(*) as events, COALESCE(SUM(downtime_minutes),0) as total_minutes')
            ->first();

        $downtimeByReason = MachineDowntime::query()
            ->join('downtime_reasons', 'downtime_reasons.id', '=', 'machine_downtimes.downtime_reason_id')
            ->whereIn('machine_downtimes.work_order_id', $orderIds)
            ->selectRaw('downtime_reasons.name as reason, COUNT(*) as events, COALESCE(SUM(machine_downtimes.downtime_minutes),0) as minutes')
            ->groupBy('downtime_reasons.id', 'downtime_reasons.name')
            ->get()
            ->map(fn ($r) => [
                'reason' => $r->reason,
                'events' => (int) $r->events,
                'minutes' => (int) $r->minutes,
            ])
            ->values()
            ->all();

        $openMaintenance = MaintenanceTicket::query()->where('status', 'open')->count();
        $closedMaintenance = MaintenanceTicket::query()
            ->where('status', 'resolved')
            ->whereBetween('resolved_at', [$from, $to.' 23:59:59'])
            ->count();

        $avgMttr = MaintenanceTicket::query()
            ->where('status', 'resolved')
            ->whereNotNull('downtime_minutes')
            ->whereBetween('resolved_at', [$from, $to.' 23:59:59'])
            ->avg('downtime_minutes');

        return [
            'period' => ['from' => $from, 'to' => $to],
            'orders' => [
                'total' => (clone $orderQuery)->count(),
                'running' => (clone $orderQuery)->where('status', WorkOrderStatus::Running)->count(),
                'completed' => (clone $orderQuery)->where('status', WorkOrderStatus::Completed)->count(),
                'paused' => (clone $orderQuery)->where('status', WorkOrderStatus::Paused)->count(),
            ],
            'production' => [
                'daily' => $dailyProduction,
                'byMachine' => $byMachine,
                'byShift' => $this->productionByShift($orderIds),
                'byWorker' => $this->productionByWorker($orderIds),
            ],
            'quality' => [
                'totalInspections' => $totalInspections,
                'passRate' => $totalInspections > 0 ? round(($passed / $totalInspections) * 100, 2) : 0,
                'failRate' => $totalInspections > 0 ? round(($failed / $totalInspections) * 100, 2) : 0,
                'topDefects' => $topDefects,
            ],
            'downtime' => [
                'events' => (int) ($downtimeStats->events ?? 0),
                'totalMinutes' => (int) ($downtimeStats->total_minutes ?? 0),
                'byReason' => $downtimeByReason,
            ],
            'maintenance' => [
                'openTickets' => $openMaintenance,
                'closedTickets' => $closedMaintenance,
                'avgMttrMinutes' => round((float) $avgMttr, 1),
            ],
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, int>  $orderIds
     * @return list<array<string, mixed>>
     */
    private function productionByShift($orderIds): array
    {
        return ProductionLog::query()
            ->join('work_orders', 'work_orders.id', '=', 'production_logs.work_order_id')
            ->join('shifts', 'shifts.id', '=', 'work_orders.shift_id')
            ->whereIn('production_logs.work_order_id', $orderIds)
            ->selectRaw('shifts.id as shift_id, shifts.name as shift_name, SUM(production_logs.good_quantity) as good_qty')
            ->groupBy('shifts.id', 'shifts.name')
            ->get()
            ->map(fn ($r) => [
                'shiftId' => (string) $r->shift_id,
                'shiftName' => $r->shift_name,
                'goodQuantity' => (int) $r->good_qty,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, int>  $orderIds
     * @return list<array<string, mixed>>
     */
    private function productionByWorker($orderIds): array
    {
        return WorkOrderWorker::query()
            ->join('employees', 'employees.id', '=', 'work_order_workers.employee_id')
            ->join('work_orders', 'work_orders.id', '=', 'work_order_workers.work_order_id')
            ->join('production_logs', 'production_logs.work_order_id', '=', 'work_orders.id')
            ->whereIn('work_order_workers.work_order_id', $orderIds)
            ->selectRaw('employees.id as employee_id, employees.name as employee_name, work_order_workers.role, SUM(production_logs.good_quantity) as good_qty')
            ->groupBy('employees.id', 'employees.name', 'work_order_workers.role')
            ->get()
            ->map(fn ($r) => [
                'employeeId' => (string) $r->employee_id,
                'employeeName' => $r->employee_name,
                'role' => $r->role,
                'goodQuantity' => (int) $r->good_qty,
            ])
            ->values()
            ->all();
    }
}
