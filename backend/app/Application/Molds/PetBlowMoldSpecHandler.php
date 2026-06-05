<?php

namespace App\Application\Molds;

use App\Application\Molds\Contracts\MoldSpecHandler;
use App\Domain\Factory\Enums\MoldType;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\PetBlowMold;

class PetBlowMoldSpecHandler implements MoldSpecHandler
{
    public function supports(MoldType $type): bool
    {
        return $type === MoldType::PetBlow;
    }

    public function upsert(Mold $mold, ?array $payload): void
    {
        if ($payload === null) {
            return;
        }

        PetBlowMold::query()->updateOrCreate(
            ['mold_id' => $mold->id],
            $this->filterPayload($payload)
        );
    }

    public function serialize(Mold $mold): ?array
    {
        $spec = $mold->relationLoaded('petBlowSpec')
            ? $mold->petBlowSpec
            : $mold->petBlowSpec()->first();

        if (! $spec) {
            return null;
        }

        return [
            'blowType' => $spec->blow_type?->value,
            'bottleVolumeMl' => $spec->bottle_volume_ml,
            'neckDiameter' => $spec->neck_diameter !== null ? (float) $spec->neck_diameter : null,
            'coolingMethod' => $spec->cooling_method,
            'airPressureRequired' => $spec->air_pressure_required !== null ? (float) $spec->air_pressure_required : null,
            'blowRatio' => $spec->blow_ratio !== null ? (float) $spec->blow_ratio : null,
            'parisonType' => $spec->parison_type,
            'coolingTime' => $spec->cooling_time !== null ? (float) $spec->cooling_time : null,
            'moldMaterial' => $spec->mold_material,
            'supportedPolymers' => $spec->supported_polymers ?? [],
            'maxTemperature' => $spec->max_temperature !== null ? (float) $spec->max_temperature : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function filterPayload(array $payload): array
    {
        $map = [
            'blowType' => 'blow_type',
            'bottleVolumeMl' => 'bottle_volume_ml',
            'neckDiameter' => 'neck_diameter',
            'coolingMethod' => 'cooling_method',
            'airPressureRequired' => 'air_pressure_required',
            'blowRatio' => 'blow_ratio',
            'parisonType' => 'parison_type',
            'coolingTime' => 'cooling_time',
            'moldMaterial' => 'mold_material',
            'supportedPolymers' => 'supported_polymers',
            'maxTemperature' => 'max_temperature',
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
