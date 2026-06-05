<?php

namespace App\Domain\Factory\Enums;

enum ProductStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Development = 'development';
}
