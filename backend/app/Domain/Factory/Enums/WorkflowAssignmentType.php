<?php

namespace App\Domain\Factory\Enums;

enum WorkflowAssignmentType: string
{
    case SingleEmployee = 'single_employee';
    case MultipleAny = 'multiple_any';
    case MultipleAll = 'multiple_all';
    case Sequential = 'sequential';
    case Department = 'department';
    case Role = 'role';
}
