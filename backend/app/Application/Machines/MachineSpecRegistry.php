<?php

namespace App\Application\Machines;

use App\Application\Machines\Contracts\MachineSpecHandler;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use InvalidArgumentException;

class MachineSpecRegistry
{
    /** @var list<MachineSpecHandler> */
    private array $handlers;

    public function __construct(
        InjectionMachineSpecHandler $injection,
        BlowMachineSpecHandler $blow,
    ) {
        $this->handlers = [$injection, $blow];
    }

    public function forType(MachineType $type): MachineSpecHandler
    {
        foreach ($this->handlers as $handler) {
            if ($handler->supports($type)) {
                return $handler;
            }
        }

        throw new InvalidArgumentException("No spec handler for machine type [{$type->code}].");
    }

    public function upsert(Machine $machine, MachineType $type, ?array $specPayload): void
    {
        if ($specPayload === null) {
            return;
        }

        $this->forType($type)->upsert($machine, $specPayload);
    }

    public function serialize(Machine $machine): ?array
    {
        $type = $machine->relationLoaded('type') ? $machine->type : $machine->type()->first();
        if (! $type) {
            return null;
        }

        try {
            return $this->forType($type)->serialize($machine);
        } catch (InvalidArgumentException) {
            return null;
        }
    }
}
