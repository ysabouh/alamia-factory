<?php

namespace App\Domain\Factory\Enums;

enum ProductType: string
{
    case FinishedGood = 'finished_good';
    case SemiFinished = 'semi_finished';
    case RawMaterial = 'raw_material';
    case Packaging = 'packaging';
    case Regrind = 'regrind';
    case SparePart = 'spare_part';
}
