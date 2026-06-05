<?php

namespace App\Application\Molds\Contracts;

use App\Domain\Factory\Enums\MoldType;
use App\Domain\Factory\Models\Mold;

interface MoldSpecHandler
{
    public function supports(MoldType $type): bool;

    /**
     * @param  array<string, mixed>|null  $payload
     */
    public function upsert(Mold $mold, ?array $payload): void;

    /**
     * @return array<string, mixed>|null
     */
    public function serialize(Mold $mold): ?array;
}
