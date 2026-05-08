<?php

namespace App\Domain\Factory\Enums;

enum MachineType: string
{
    case Injection = 'injection';
    case BlowMolding = 'blow_molding';
    case Line = 'line';
}
