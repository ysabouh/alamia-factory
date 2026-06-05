<?php

namespace App\Domain\Factory\Enums;

enum ProductImageType: string
{
    case Main = 'main';
    case Technical = 'technical';
    case Packaging = 'packaging';
    case Marketing = 'marketing';
    case Drawing = 'drawing';
}
