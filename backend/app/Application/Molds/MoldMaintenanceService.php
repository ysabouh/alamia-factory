<?php

namespace App\Application\Molds;

use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\MoldMaintenanceLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MoldMaintenanceService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function log(Mold $mold, array $data): MoldMaintenanceLog
    {
        return DB::transaction(function () use ($mold, $data): MoldMaintenanceLog {
            $log = MoldMaintenanceLog::query()->create([
                'mold_id' => $mold->id,
                'maintenance_type' => $data['maintenance_type'],
                'description' => $data['description'] ?? null,
                'technician' => $data['technician'] ?? null,
                'maintenance_date' => $data['maintenance_date'],
                'cost' => $data['cost'] ?? null,
                'next_maintenance_date' => $data['next_maintenance_date'] ?? null,
            ]);

            $mold->update([
                'last_maintenance_date' => $data['maintenance_date'],
                'next_maintenance_date' => $data['next_maintenance_date'] ?? $mold->next_maintenance_date,
            ]);

            return $log;
        });
    }

    public function listForMold(Mold $mold): Collection
    {
        return $mold->maintenanceLogs()->orderByDesc('maintenance_date')->get();
    }
}
