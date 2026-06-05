<?php

namespace App\Domain\Factory\Enums;

enum ManufacturingMode: string
{
    case Manufactured = 'manufactured';
    case Assembled = 'assembled';
    case Hybrid = 'hybrid';
    case Purchased = 'purchased';
}
