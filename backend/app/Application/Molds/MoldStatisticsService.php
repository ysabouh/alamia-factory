<?php

namespace App\Application\Molds;

use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\MoldImage;
use App\Domain\Factory\Models\MoldMaintenanceLog;
use App\Domain\Factory\Models\PolyethyleneMold;
use Illuminate\Support\Facades\DB;

class MoldStatisticsService
{
    /**
     * @return array<string, mixed>
     */
    public function aggregate(): array
    {
        $byType = Mold::query()
            ->select('mold_type', DB::raw('count(*) as total'))
            ->groupBy('mold_type')
            ->pluck('total', 'mold_type')
            ->all();

        $byStatus = Mold::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $maintenanceDue = Mold::query()
            ->whereNotNull('next_maintenance_date')
            ->whereDate('next_maintenance_date', '<=', today())
            ->count();

        $maintenanceLogs30d = MoldMaintenanceLog::query()
            ->whereDate('maintenance_date', '>=', today()->subDays(30))
            ->count();

        $peByMaterial = PolyethyleneMold::query()
            ->select('polyethylene_type', DB::raw('count(*) as total'))
            ->whereNotNull('polyethylene_type')
            ->groupBy('polyethylene_type')
            ->pluck('total', 'polyethylene_type')
            ->all();

        $peByMethod = PolyethyleneMold::query()
            ->select('production_method', DB::raw('count(*) as total'))
            ->whereNotNull('production_method')
            ->groupBy('production_method')
            ->pluck('total', 'production_method')
            ->all();

        $imagesByType = MoldImage::query()
            ->select('image_type', DB::raw('count(*) as total'))
            ->groupBy('image_type')
            ->pluck('total', 'image_type')
            ->all();

        return [
            'total' => Mold::query()->count(),
            'byType' => [
                'injection' => (int) ($byType['injection'] ?? 0),
                'pet_blow' => (int) ($byType['pet_blow'] ?? 0),
                'compression' => (int) ($byType['compression'] ?? 0),
                'polyethylene' => (int) ($byType['polyethylene'] ?? 0),
            ],
            'byStatus' => [
                'active' => (int) ($byStatus['active'] ?? 0),
                'maintenance' => (int) ($byStatus['maintenance'] ?? 0),
                'inactive' => (int) ($byStatus['inactive'] ?? 0),
            ],
            'maintenanceDue' => $maintenanceDue,
            'maintenanceLogsLast30Days' => $maintenanceLogs30d,
            'polyethylene' => [
                'byMaterial' => [
                    'hdpe' => (int) ($peByMaterial['hdpe'] ?? 0),
                    'ldpe' => (int) ($peByMaterial['ldpe'] ?? 0),
                    'lldpe' => (int) ($peByMaterial['lldpe'] ?? 0),
                ],
                'byProductionMethod' => [
                    'blow' => (int) ($peByMethod['blow'] ?? 0),
                    'rotational' => (int) ($peByMethod['rotational'] ?? 0),
                    'extrusion' => (int) ($peByMethod['extrusion'] ?? 0),
                ],
            ],
            'imagesByType' => [
                'photo' => (int) ($imagesByType['photo'] ?? 0),
                'technical_drawing' => (int) ($imagesByType['technical_drawing'] ?? 0),
                'exploded_diagram' => (int) ($imagesByType['exploded_diagram'] ?? 0),
                'maintenance_photo' => (int) ($imagesByType['maintenance_photo'] ?? 0),
            ],
        ];
    }
}
