<?php

namespace App\Domain\Factory\Enums;

enum MaintenanceTicketKind: string
{
    case Breakdown = 'breakdown';
    case Maintenance = 'maintenance';
}
