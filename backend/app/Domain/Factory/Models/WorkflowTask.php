<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\WorkflowPriority;
use App\Domain\Factory\Enums\WorkflowTaskStatus;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkflowTask extends Model
{
    use SoftDeletes;
    use TracksAuditorColumns;

    protected $fillable = [
        'task_number',
        'instance_id',
        'stage_id',
        'assigned_to',
        'sequence_order',
        'status',
        'priority',
        'due_at',
        'started_at',
        'accepted_at',
        'completed_at',
        'duration_minutes',
        'is_overdue',
        'completed_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => WorkflowTaskStatus::class,
            'priority' => WorkflowPriority::class,
            'due_at' => 'datetime',
            'started_at' => 'datetime',
            'accepted_at' => 'datetime',
            'completed_at' => 'datetime',
            'is_overdue' => 'boolean',
        ];
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(WorkflowInstance::class, 'instance_id');
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(WorkflowStage::class, 'stage_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_to');
    }

    public function completedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function checklistCompletions(): HasMany
    {
        return $this->hasMany(WorkflowTaskChecklistCompletion::class, 'task_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(WorkflowTaskComment::class, 'task_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(WorkflowTaskAttachment::class, 'task_id');
    }
}
