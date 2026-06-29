<?php

namespace App\Domain\Factory\Enums;

enum WorkflowTimelineAction: string
{
    case Created = 'created';
    case Assigned = 'assigned';
    case Accepted = 'accepted';
    case Started = 'started';
    case Updated = 'updated';
    case Returned = 'returned';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case ClarificationRequested = 'clarification_requested';
    case StageAdvanced = 'stage_advanced';
    case Overdue = 'overdue';
}
