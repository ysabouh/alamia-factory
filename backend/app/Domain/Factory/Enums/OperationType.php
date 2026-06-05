<?php

namespace App\Domain\Factory\Enums;

enum OperationType: string
{
    case Injection = 'injection';
    case Blow = 'blow';
    case Compression = 'compression';
    case Assembly = 'assembly';
    case Packaging = 'packaging';
    case Labeling = 'labeling';
    case Inspection = 'inspection';
    case Cooling = 'cooling';
    case Trimming = 'trimming';
    case Printing = 'printing';

    /** @return list<string> */
    public function allowedMachineTypeCodes(): array
    {
        return match ($this) {
            self::Injection => ['injection'],
            self::Blow => ['blow', 'blow_molding'],
            self::Compression => ['compression'],
            self::Assembly, self::Packaging, self::Labeling, self::Inspection,
            self::Cooling, self::Trimming, self::Printing => [],
        };
    }

    public function requiresMold(): bool
    {
        return in_array($this, [self::Injection, self::Blow, self::Compression], true);
    }

    public function requiresMachine(): bool
    {
        return in_array($this, [self::Injection, self::Blow, self::Compression, self::Printing], true);
    }

    public function defaultMoldType(): ?string
    {
        return match ($this) {
            self::Injection => 'injection',
            self::Blow => 'pet_blow',
            self::Compression => 'compression',
            default => null,
        };
    }
}
