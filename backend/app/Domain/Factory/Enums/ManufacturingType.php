<?php

namespace App\Domain\Factory\Enums;

enum ManufacturingType: string
{
    case Injection = 'injection';
    case PetBlow = 'pet_blow';
    case Compression = 'compression';
    case Polyethylene = 'polyethylene';
}
