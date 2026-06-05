<?php

namespace App\Domain\Factory\Enums;

enum InspectionStatus: string
{
    case Passed = 'passed';
    case Warning = 'warning';
    case Failed = 'failed';
}
