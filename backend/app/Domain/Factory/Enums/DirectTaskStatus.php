<?php

namespace App\Domain\Factory\Enums;

enum DirectTaskStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Assigned = 'assigned';
    case Accepted = 'accepted';
    case InProgress = 'in_progress';
    case WaitingReview = 'waiting_review';
    case Approved = 'approved';
    case Completed = 'completed';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
    case Overdue = 'overdue';
}
