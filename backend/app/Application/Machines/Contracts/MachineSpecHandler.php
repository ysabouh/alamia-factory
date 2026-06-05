<?php

namespace App\Application\Machines\Contracts;

use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;

interface MachineSpecHandler
{
    public function supports(MachineType $type): bool;

  /**
   * @param  array<string, mixed>|null  $payload
   */
    public function upsert(Machine $machine, ?array $payload): void;

    /**
     * @return array<string, mixed>|null
     */
    public function serialize(Machine $machine): ?array;
}
