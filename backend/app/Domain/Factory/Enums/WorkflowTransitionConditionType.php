<?php

namespace App\Domain\Factory\Enums;

enum WorkflowTransitionConditionType: string
{
    case Default = 'default';
    case OnApprove = 'on_approve';
    case OnReject = 'on_reject';
    case OnReturn = 'on_return';
}
