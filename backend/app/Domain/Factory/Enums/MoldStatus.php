<?php

namespace App\Domain\Factory\Enums;

enum MoldStatus: string
{
    case Active = 'active';
    case Maintenance = 'maintenance';
    case Inactive = 'inactive';
}
