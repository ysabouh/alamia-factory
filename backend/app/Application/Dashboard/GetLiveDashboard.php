<?php

namespace App\Application\Dashboard;

use App\Domain\Factory\Models\Alert;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Domain\Factory\Models\ProductionEntry;
use App\Domain\Factory\Models\StockLevel;
use App\Domain\Factory\Models\WasteEntry;
use Illuminate\Support\Carbon;

class GetLiveDashboard
{
    public function handle(): array
    {
        $today = Carbon::today();
        $production = ProductionEntry::query()->whereDate('entry_date', $today);
        $waste = WasteEntry::query()->whereDate('entry_date', $today);
        $machines = Machine::query()
            ->with(['type', 'activeAssignment.mold', 'activeAssignment.operator', 'activeAssignment.technician'])
            ->orderBy('code')
            ->get();

        $producedPieces = (int) $production->sum('produced_pieces');
        $producedWeight = (float) $production->sum('produced_weight_kg');
        $wasteWeight = (float) $waste->sum('weight_kg');
        $totalWeight = $producedWeight + $wasteWeight;

        return [
            'kpis' => [
                'producedPiecesToday' => $producedPieces,
                'producedWeightKgToday' => round($producedWeight, 3),
                'wasteRate' => $totalWeight > 0 ? round(($wasteWeight / $totalWeight) * 100, 2) : 0,
                'machineUtilization' => $machines->count() > 0
                    ? round(($machines->where('status.value', 'running')->count() / $machines->count()) * 100, 2)
                    : 0,
                'openMaintenanceTickets' => MaintenanceTicket::query()->whereIn('status', ['open', 'in_progress'])->count(),
                'lowStockItems' => StockLevel::query()->where('quantity', '<=', 0)->count(),
            ],
            'machines' => $machines->map(fn (Machine $machine): array => $this->machineSnapshot($machine, $today))->values(),
            'productionTrend' => $this->productionTrend($today),
            'alerts' => Alert::query()
                ->whereNull('resolved_at')
                ->latest()
                ->limit(10)
                ->get(['id', 'severity', 'message', 'created_at'])
                ->map(fn (Alert $alert): array => [
                    'id' => $alert->id,
                    'severity' => $alert->severity,
                    'message' => $alert->message,
                    'createdAt' => $alert->created_at?->toISOString(),
                ]),
        ];
    }

    private function machineSnapshot(Machine $machine, Carbon $today): array
    {
        $assignment = $machine->activeAssignment;
        $production = $machine->productionEntries()->whereDate('entry_date', $today);
        $waste = WasteEntry::query()->where('machine_id', $machine->id)->whereDate('entry_date', $today);

        return [
            'id' => $machine->id,
            'code' => $machine->code,
            'name' => $machine->name,
            'type' => $machine->type?->code,
            'status' => $machine->status->value,
            'currentMold' => $assignment?->mold?->name,
            'operator' => $assignment?->operator?->name,
            'technician' => $assignment?->technician?->name,
            'producedPiecesToday' => (int) $production->sum('produced_pieces'),
            'producedWeightKgToday' => (float) $production->sum('produced_weight_kg'),
            'wasteKgToday' => (float) $waste->sum('weight_kg'),
            'downtimeMinutesToday' => 0,
            'activeAlert' => $machine->status_note,
        ];
    }

    private function productionTrend(Carbon $today): array
    {
        return ProductionEntry::query()
            ->whereDate('entry_date', $today)
            ->selectRaw('HOUR(created_at) as hour, SUM(produced_pieces) as produced')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(fn ($row): array => [
                'label' => str_pad((string) $row->hour, 2, '0', STR_PAD_LEFT).':00',
                'produced' => (int) $row->produced,
                'waste' => 0,
            ])
            ->values()
            ->all();
    }
}
