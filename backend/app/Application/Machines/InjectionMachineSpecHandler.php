<?php

namespace App\Application\Machines;

use App\Application\Machines\Contracts\MachineSpecHandler;
use App\Domain\Factory\Models\InjectionMachineSpec;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;

class InjectionMachineSpecHandler implements MachineSpecHandler
{
    public function supports(MachineType $type): bool
    {
        return $type->code === 'injection';
    }

    public function upsert(Machine $machine, ?array $payload): void
    {
        if ($payload === null) {
            return;
        }

        InjectionMachineSpec::query()->updateOrCreate(
            ['machine_id' => $machine->id],
            $this->filterPayload($payload)
        );
    }

    public function serialize(Machine $machine): ?array
    {
        $spec = $machine->relationLoaded('injectionSpec')
            ? $machine->injectionSpec
            : $machine->injectionSpec()->first();

        if (! $spec) {
            return null;
        }

        return [
            'clampingForceTon' => $spec->clamping_force_ton !== null ? (float) $spec->clamping_force_ton : null,
            'shotWeightGram' => $spec->shot_weight_gram !== null ? (float) $spec->shot_weight_gram : null,
            'screwDiameterMm' => $spec->screw_diameter_mm !== null ? (float) $spec->screw_diameter_mm : null,
            'injectionPressureBar' => $spec->injection_pressure_bar !== null ? (float) $spec->injection_pressure_bar : null,
            'heatingZonesCount' => $spec->heating_zones_count,
            'maxCycleTimeSec' => $spec->max_cycle_time_sec !== null ? (float) $spec->max_cycle_time_sec : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function filterPayload(array $payload): array
    {
        $map = [
            'clampingForceTon' => 'clamping_force_ton',
            'shotWeightGram' => 'shot_weight_gram',
            'screwDiameterMm' => 'screw_diameter_mm',
            'injectionPressureBar' => 'injection_pressure_bar',
            'heatingZonesCount' => 'heating_zones_count',
            'maxCycleTimeSec' => 'max_cycle_time_sec',
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
