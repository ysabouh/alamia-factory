<?php

namespace App\Domain\Factory\Enums;

enum WorkflowInstanceStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Assigned = 'assigned';
    case Accepted = 'accepted';
    case InProgress = 'in_progress';
    case WaitingApproval = 'waiting_approval';
    case WaitingInformation = 'waiting_information';
    case Rejected = 'rejected';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Overdue = 'overdue';
}
