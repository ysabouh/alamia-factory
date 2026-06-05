<?php

namespace App\Application\Molds;

use App\Domain\Factory\Enums\MoldType;
use App\Domain\Factory\Models\Machine;
use InvalidArgumentException;

class MoldMachineCompatibility
{
    /** @var array<string, list<string>> */
    private const MAP = [
        'injection' => ['injection'],
        'pet_blow' => ['blow', 'blow_molding'],
        'compression' => ['compression'],
        'polyethylene' => ['pe_production', 'pe_rotational', 'pe_blow', 'pe_extrusion'],
    ];

    public function assertCompatible(string $moldType, ?Machine $machine): void
    {
        if ($machine === null) {
            return;
        }

        $machine->loadMissing('type');
        $typeCode = $machine->type?->code;
        if ($typeCode === null) {
            throw new InvalidArgumentException('Machine type is required for compatibility check.');
        }

        $allowed = self::MAP[$moldType] ?? [];
        if (! in_array($typeCode, $allowed, true)) {
            throw new InvalidArgumentException(
                "Mold type [{$moldType}] is not compatible with machine type [{$typeCode}]."
            );
        }
    }

    /**
     * @return list<Machine>
     */
    public function compatibleMachines(MoldType $moldType): array
    {
        $allowed = self::MAP[$moldType->value] ?? [];

        return Machine::query()
            ->with('type')
            ->where('is_active', true)
            ->whereHas('type', fn ($q) => $q->whereIn('code', $allowed))
            ->orderBy('code')
            ->get()
            ->all();
    }

    /**
     * @return list<string>
     */
    public function allowedMachineTypeCodes(string $moldType): array
    {
        return self::MAP[$moldType] ?? [];
    }
}
