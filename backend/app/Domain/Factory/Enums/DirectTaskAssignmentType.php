<?php

namespace App\Domain\Factory\Enums;

enum DirectTaskAssignmentType: string
{
    case Employee = 'employee';
    case Department = 'department';
    case Team = 'team';
}
