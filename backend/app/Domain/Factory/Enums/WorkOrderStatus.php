<?php

namespace App\Domain\Factory\Enums;

enum WorkOrderStatus: string
{
    case Draft = 'draft';
    case Running = 'running';
    case Paused = 'paused';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
