<?php

namespace App\Application\Molds;

use App\Application\Molds\Contracts\MoldSpecHandler;
use App\Domain\Factory\Enums\MoldType;
use App\Domain\Factory\Models\InjectionMold;
use App\Domain\Factory\Models\Mold;
use InvalidArgumentException;

class InjectionMoldSpecHandler implements MoldSpecHandler
{
    public function supports(MoldType $type): bool
    {
        return $type === MoldType::Injection;
    }

    public function upsert(Mold $mold, ?array $payload): void
    {
        if ($payload === null) {
            return;
        }

        InjectionMold::query()->updateOrCreate(
            ['mold_id' => $mold->id],
            $this->filterPayload($payload)
        );
    }

    public function serialize(Mold $mold): ?array
    {
        $spec = $mold->relationLoaded('injectionSpec')
            ? $mold->injectionSpec
            : $mold->injectionSpec()->first();

        if (! $spec) {
            return null;
        }

        return [
            'hotRunner' => (bool) $spec->hot_runner,
            'runnerType' => $spec->runner_type,
            'gateType' => $spec->gate_type,
            'coolingCircuitCount' => $spec->cooling_circuit_count,
            'ejectorSystemType' => $spec->ejector_system_type,
            'maxInjectionPressure' => $spec->max_injection_pressure !== null ? (float) $spec->max_injection_pressure : null,
            'clampForceRequired' => $spec->clamp_force_required !== null ? (float) $spec->clamp_force_required : null,
            'cycleTime' => $spec->cycle_time !== null ? (float) $spec->cycle_time : null,
            'moldSteelType' => $spec->mold_steel_type,
            'shrinkageRate' => $spec->shrinkage_rate !== null ? (float) $spec->shrinkage_rate : null,
            'corePullCount' => $spec->core_pull_count,
            'textureType' => $spec->texture_type,
            'supportedMaterials' => $spec->supported_materials ?? [],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function filterPayload(array $payload): array
    {
        $map = [
            'hotRunner' => 'hot_runner',
            'runnerType' => 'runner_type',
            'gateType' => 'gate_type',
            'coolingCircuitCount' => 'cooling_circuit_count',
            'ejectorSystemType' => 'ejector_system_type',
            'maxInjectionPressure' => 'max_injection_pressure',
            'clampForceRequired' => 'clamp_force_required',
            'cycleTime' => 'cycle_time',
            'moldSteelType' => 'mold_steel_type',
            'shrinkageRate' => 'shrinkage_rate',
            'corePullCount' => 'core_pull_count',
            'textureType' => 'texture_type',
            'supportedMaterials' => 'supported_materials',
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
