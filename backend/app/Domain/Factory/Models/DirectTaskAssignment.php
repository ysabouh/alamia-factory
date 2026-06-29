<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\DirectTaskAssignmentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DirectTaskAssignment extends Model
{
    protected $fillable = [
        'schedule_id',
        'task_id',
        'assignment_type',
        'assignee_id',
        'assignee_label',
    ];

    protected function casts(): array
    {
        return [
            'assignment_type' => DirectTaskAssignmentType::class,
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(DirectTaskSchedule::class, 'schedule_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(DirectTask::class, 'task_id');
    }
}
