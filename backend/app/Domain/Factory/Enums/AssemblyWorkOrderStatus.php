<?php

namespace App\Domain\Factory\Enums;

enum AssemblyWorkOrderStatus: string
{
    case Draft = 'draft';
    case Planned = 'planned';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
