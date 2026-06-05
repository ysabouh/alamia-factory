<?php

namespace App\Domain\Factory\Enums;

enum ChecklistItemType: string
{
    case Numeric = 'numeric';
    case Boolean = 'boolean';
    case Text = 'text';
    case Selection = 'selection';
}
