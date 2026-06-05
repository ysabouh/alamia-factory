<?php

namespace App\Domain\Factory\Enums;

enum InspectionResultStatus: string
{
    case Pass = 'pass';
    case Fail = 'fail';
    case Warning = 'warning';
}
