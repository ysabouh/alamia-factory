<?php

namespace App\Interfaces\Http\Support;

use App\Application\Molds\MoldSpecRegistry;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\MoldImage;
use App\Domain\Factory\Models\MoldInstallation;
use App\Domain\Factory\Models\MoldMaintenanceLog;

trait SerializesMolds
{
    /**
     * @return array<string, mixed>
     */
    protected function serializeMold(Mold $mold, bool $detail = false): array
    {
        $registry = app(MoldSpecRegistry::class);
        $primaryImage = $mold->relationLoaded('images')
            ? $mold->images->firstWhere('is_primary', true) ?? $mold->images->first()
            : null;

        $base = [
            'id' => (string) $mold->id,
            'moldCode' => $mold->code,
            'moldName' => $mold->name,
            'moldType' => $mold->mold_type->value,
            'status' => $mold->status->value,
            'productId' => $mold->product_id !== null ? (string) $mold->product_id : null,
            'productName' => $mold->product_name ?? $mold->product?->name,
            'cavityCount' => (int) $mold->cavity_count,
            'materialType' => $mold->material_type,
            'machineId' => $mold->machine_id !== null ? (string) $mold->machine_id : null,
            'machineCode' => $mold->machine?->code,
            'machineName' => $mold->machine?->name,
            'manufacturer' => $mold->manufacturer,
            'manufacturingCountry' => $mold->manufacturing_country,
            'manufacturingDate' => $mold->manufacturing_date?->toDateString(),
            'purchaseDate' => $mold->purchase_date?->toDateString(),
            'purchaseCost' => $mold->purchase_cost !== null ? (float) $mold->purchase_cost : null,
            'moldWeight' => $mold->mold_weight !== null ? (float) $mold->mold_weight : null,
            'moldDimensions' => $mold->mold_dimensions,
            'expectedLifeCycles' => $mold->expected_life_cycles !== null ? (int) $mold->expected_life_cycles : null,
            'totalCycles' => (int) $mold->total_cycles,
            'currentLocation' => $mold->current_location,
            'maintenanceCycle' => $mold->maintenance_cycle,
            'lastMaintenanceDate' => $mold->last_maintenance_date?->toDateString(),
            'nextMaintenanceDate' => $mold->next_maintenance_date?->toDateString(),
            'imageUrl' => $mold->image_url ?? $primaryImage?->image_url,
            'notes' => $mold->notes,
            'isActive' => (bool) $mold->is_active,
            'createdAt' => $mold->created_at?->toIso8601String(),
            'updatedAt' => $mold->updated_at?->toIso8601String(),
        ];

        if (! $detail) {
            return $base;
        }

        return array_merge($base, [
            'spec' => $registry->serialize($mold),
            'images' => $mold->relationLoaded('images')
                ? $mold->images->map(fn (MoldImage $img) => $this->serializeMoldImage($img))->values()->all()
                : [],
            'maintenanceLogs' => $mold->relationLoaded('maintenanceLogs')
                ? $mold->maintenanceLogs->map(fn (MoldMaintenanceLog $log) => $this->serializeMaintenanceLog($log))->values()->all()
                : [],
            'installations' => $mold->relationLoaded('installations')
                ? $mold->installations->map(fn (MoldInstallation $i) => $this->serializeInstallation($i))->values()->all()
                : [],
            'activeInstallation' => $mold->relationLoaded('activeInstallation') && $mold->activeInstallation
                ? $this->serializeInstallation($mold->activeInstallation)
                : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeMoldImage(MoldImage $image): array
    {
        return [
            'id' => (string) $image->id,
            'moldId' => (string) $image->mold_id,
            'imageUrl' => $image->image_url,
            'imageType' => $image->image_type,
            'isPrimary' => (bool) $image->is_primary,
            'uploadedAt' => $image->uploaded_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeMaintenanceLog(MoldMaintenanceLog $log): array
    {
        return [
            'id' => (string) $log->id,
            'maintenanceType' => $log->maintenance_type,
            'description' => $log->description,
            'technician' => $log->technician,
            'maintenanceDate' => $log->maintenance_date?->toDateString(),
            'cost' => $log->cost !== null ? (float) $log->cost : null,
            'nextMaintenanceDate' => $log->next_maintenance_date?->toDateString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeInstallation(MoldInstallation $installation): array
    {
        return [
            'id' => (string) $installation->id,
            'machineId' => (string) $installation->machine_id,
            'machineCode' => $installation->machine?->code,
            'machineName' => $installation->machine?->name,
            'machineType' => $installation->machine?->type?->code,
            'installedAt' => $installation->installed_at?->toIso8601String(),
            'removedAt' => $installation->removed_at?->toIso8601String(),
            'installedBy' => $installation->installed_by !== null ? (string) $installation->installed_by : null,
            'notes' => $installation->notes,
        ];
    }
}
