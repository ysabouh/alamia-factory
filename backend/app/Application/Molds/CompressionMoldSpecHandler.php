<?php

namespace App\Application\Molds;

use App\Application\Molds\Contracts\MoldSpecHandler;
use App\Domain\Factory\Enums\MoldType;
use App\Domain\Factory\Models\CompressionMold;
use App\Domain\Factory\Models\Mold;

class CompressionMoldSpecHandler implements MoldSpecHandler
{
    public function supports(MoldType $type): bool
    {
        return $type === MoldType::Compression;
    }

    public function upsert(Mold $mold, ?array $payload): void
    {
        if ($payload === null) {
            return;
        }

        CompressionMold::query()->updateOrCreate(
            ['mold_id' => $mold->id],
            $this->filterPayload($payload)
        );
    }

    public function serialize(Mold $mold): ?array
    {
        $spec = $mold->relationLoaded('compressionSpec')
            ? $mold->compressionSpec
            : $mold->compressionSpec()->first();

        if (! $spec) {
            return null;
        }

        return [
            'compressionForce' => $spec->compression_force !== null ? (float) $spec->compression_force : null,
            'heatingType' => $spec->heating_type,
            'moldTemperature' => $spec->mold_temperature !== null ? (float) $spec->mold_temperature : null,
            'pressureTime' => $spec->pressure_time !== null ? (float) $spec->pressure_time : null,
            'curingTime' => $spec->curing_time !== null ? (float) $spec->curing_time : null,
            'moldMaterial' => $spec->mold_material,
            'heatingZones' => $spec->heating_zones,
            'supportedMaterials' => $spec->supported_materials ?? [],
            'maxProductThickness' => $spec->max_product_thickness !== null ? (float) $spec->max_product_thickness : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function filterPayload(array $payload): array
    {
        $map = [
            'compressionForce' => 'compression_force',
            'heatingType' => 'heating_type',
            'moldTemperature' => 'mold_temperature',
            'pressureTime' => 'pressure_time',
            'curingTime' => 'curing_time',
            'moldMaterial' => 'mold_material',
            'heatingZones' => 'heating_zones',
            'supportedMaterials' => 'supported_materials',
            'maxProductThickness' => 'max_product_thickness',
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
