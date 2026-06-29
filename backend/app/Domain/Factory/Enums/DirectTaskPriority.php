<?php

namespace App\Domain\Factory\Enums;

enum DirectTaskPriority: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Urgent = 'urgent';
}
