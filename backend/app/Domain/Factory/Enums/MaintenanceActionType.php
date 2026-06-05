<?php

namespace App\Domain\Factory\Enums;

enum MaintenanceActionType: string
{
    case Preventive = 'preventive';
    case Corrective = 'corrective';
    case Emergency = 'emergency';
}
