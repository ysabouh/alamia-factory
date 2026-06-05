<?php

namespace App\Application\Molds;

use App\Application\Molds\Contracts\MoldSpecHandler;
use App\Domain\Factory\Enums\MoldType;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\PolyethyleneMold;

class PolyethyleneMoldSpecHandler implements MoldSpecHandler
{
    public function supports(MoldType $type): bool
    {
        return $type === MoldType::Polyethylene;
    }

    public function upsert(Mold $mold, ?array $payload): void
    {
        if ($payload === null) {
            return;
        }

        PolyethyleneMold::query()->updateOrCreate(
            ['mold_id' => $mold->id],
            $this->filterPayload($payload)
        );
    }

    public function serialize(Mold $mold): ?array
    {
        $spec = $mold->relationLoaded('polyethyleneSpec')
            ? $mold->polyethyleneSpec
            : $mold->polyethyleneSpec()->first();

        if (! $spec) {
            return null;
        }

        return [
            'polyethyleneType' => $spec->polyethylene_type?->value,
            'productionMethod' => $spec->production_method?->value,
            'tankVolume' => $spec->tank_volume !== null ? (float) $spec->tank_volume : null,
            'wallThickness' => $spec->wall_thickness !== null ? (float) $spec->wall_thickness : null,
            'coolingMethod' => $spec->cooling_method,
            'moldMaterial' => $spec->mold_material,
            'heatingSystem' => $spec->heating_system,
            'cycleTime' => $spec->cycle_time !== null ? (float) $spec->cycle_time : null,
            'pressureRating' => $spec->pressure_rating !== null ? (float) $spec->pressure_rating : null,
            'supportedProducts' => $spec->supported_products ?? [],
            'maxTemperature' => $spec->max_temperature !== null ? (float) $spec->max_temperature : null,
            'minTemperature' => $spec->min_temperature !== null ? (float) $spec->min_temperature : null,
            'moldLayers' => $spec->mold_layers,
            'rotationalSpeed' => $spec->rotational_speed !== null ? (float) $spec->rotational_speed : null,
            'shrinkageRate' => $spec->shrinkage_rate !== null ? (float) $spec->shrinkage_rate : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function filterPayload(array $payload): array
    {
        $map = [
            'polyethyleneType' => 'polyethylene_type',
            'productionMethod' => 'production_method',
            'tankVolume' => 'tank_volume',
            'wallThickness' => 'wall_thickness',
            'coolingMethod' => 'cooling_method',
            'moldMaterial' => 'mold_material',
            'heatingSystem' => 'heating_system',
            'cycleTime' => 'cycle_time',
            'pressureRating' => 'pressure_rating',
            'supportedProducts' => 'supported_products',
            'maxTemperature' => 'max_temperature',
            'minTemperature' => 'min_temperature',
            'moldLayers' => 'mold_layers',
            'rotationalSpeed' => 'rotational_speed',
            'shrinkageRate' => 'shrinkage_rate',
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
