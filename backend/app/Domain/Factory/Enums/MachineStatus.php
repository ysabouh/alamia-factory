<?php

namespace App\Domain\Factory\Enums;

enum MachineStatus: string
{
    case Running = 'running';
    case Stopped = 'stopped';
    case Maintenance = 'maintenance';
    case Breakdown = 'breakdown';
}
