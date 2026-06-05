<?php

namespace App\Domain\Factory\Enums;

enum PeProductionMethod: string
{
    case Blow = 'blow';
    case Rotational = 'rotational';
    case Extrusion = 'extrusion';
}
