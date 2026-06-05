<?php

namespace App\Domain\Factory\Enums;

enum WorkOrderWorkerRole: string
{
    case Operator = 'operator';
    case Helper = 'helper';
    case Packer = 'packer';
    case ShiftLeader = 'shift_leader';
}
