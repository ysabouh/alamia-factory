<?php

namespace App\Domain\Factory\Enums;

enum MachineStatus: string
{
    case Running = 'running';
    case Idle = 'idle';
    case Maintenance = 'maintenance';
    case Down = 'down';
}
