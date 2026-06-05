<?php

namespace App\Application\Molds;

use App\Application\Molds\Contracts\MoldSpecHandler;
use App\Domain\Factory\Enums\MoldType;
use App\Domain\Factory\Models\Mold;
use InvalidArgumentException;

class MoldSpecRegistry
{
    /** @var list<MoldSpecHandler> */
    private array $handlers;

    public function __construct(
        InjectionMoldSpecHandler $injection,
        PetBlowMoldSpecHandler $petBlow,
        CompressionMoldSpecHandler $compression,
        PolyethyleneMoldSpecHandler $polyethylene,
    ) {
        $this->handlers = [$injection, $petBlow, $compression, $polyethylene];
    }

    public function forType(MoldType $type): MoldSpecHandler
    {
        foreach ($this->handlers as $handler) {
            if ($handler->supports($type)) {
                return $handler;
            }
        }

        throw new InvalidArgumentException("No spec handler for mold type [{$type->value}].");
    }

    public function upsert(Mold $mold, MoldType $type, ?array $specPayload): void
    {
        if ($specPayload === null) {
            return;
        }

        $this->forType($type)->upsert($mold, $specPayload);
    }

    public function serialize(Mold $mold): ?array
    {
        try {
            return $this->forType($mold->mold_type)->serialize($mold);
        } catch (InvalidArgumentException) {
            return null;
        }
    }
}
