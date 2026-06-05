<?php

namespace App\Application\Machines;

use App\Application\Machines\Contracts\MachineSpecHandler;
use App\Domain\Factory\Models\BlowMachineSpec;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;

class BlowMachineSpecHandler implements MachineSpecHandler
{
    public function supports(MachineType $type): bool
    {
        return in_array($type->code, ['blow', 'blow_molding'], true);
    }

    public function upsert(Machine $machine, ?array $payload): void
    {
        if ($payload === null) {
            return;
        }

        BlowMachineSpec::query()->updateOrCreate(
            ['machine_id' => $machine->id],
            $this->filterPayload($payload)
        );
    }

    public function serialize(Machine $machine): ?array
    {
        $spec = $machine->relationLoaded('blowSpec')
            ? $machine->blowSpec
            : $machine->blowSpec()->first();

        if (! $spec) {
            return null;
        }

        return [
            'bottleVolumeMinMl' => $spec->bottle_volume_min_ml,
            'bottleVolumeMaxMl' => $spec->bottle_volume_max_ml,
            'cavitiesCount' => $spec->cavities_count,
            'airPressureBar' => $spec->air_pressure_bar !== null ? (float) $spec->air_pressure_bar : null,
            'productionCapacityBph' => $spec->production_capacity_bph,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function filterPayload(array $payload): array
    {
        $map = [
            'bottleVolumeMinMl' => 'bottle_volume_min_ml',
            'bottleVolumeMaxMl' => 'bottle_volume_max_ml',
            'cavitiesCount' => 'cavities_count',
            'airPressureBar' => 'air_pressure_bar',
            'productionCapacityBph' => 'production_capacity_bph',
        ];

        $out = [];
        foreach ($map as $camel => $snake) {
            if (array_key_exists($camel, $payload)) {
                $out[$snake] = $payload[$camel];
            } elseif (array_key_exists($snake, $payload)) {
                $out[$snake] = $payload[$snake];
            }
        }

        return $out;
    }
}
