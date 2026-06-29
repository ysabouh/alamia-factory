<?php

namespace App\Domain\Factory\Enums;

enum WorkflowPriority: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Urgent = 'urgent';
}
