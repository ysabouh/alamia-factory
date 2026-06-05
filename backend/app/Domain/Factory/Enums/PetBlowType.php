<?php

namespace App\Domain\Factory\Enums;

enum PetBlowType: string
{
    case Extrusion = 'extrusion';
    case Injection = 'injection';
    case Stretch = 'stretch';
}
