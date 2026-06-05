<?php

namespace App\Domain\Factory\Enums;

enum BomComponentType: string
{
    case RawMaterial = 'raw_material';
    case Component = 'component';
    case Subassembly = 'subassembly';
    case Packaging = 'packaging';
    case Consumable = 'consumable';
}
