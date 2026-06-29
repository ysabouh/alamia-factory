<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\WorkflowInstanceStatus;
use App\Domain\Factory\Enums\WorkflowPriority;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkflowInstance extends Model
{
    use SoftDeletes;
    use TracksAuditorColumns;

    protected $fillable = [
        'workflow_number',
        'template_version_id',
        'current_stage_id',
        'status',
        'priority',
        'progress_percent',
        'started_at',
        'due_at',
        'completed_at',
        'subject_type',
        'subject_id',
        'initiated_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => WorkflowInstanceStatus::class,
            'priority' => WorkflowPriority::class,
            'started_at' => 'datetime',
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function templateVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplateVersion::class, 'template_version_id');
    }

    public function currentStage(): BelongsTo
    {
        return $this->belongsTo(WorkflowStage::class, 'current_stage_id');
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(WorkflowTask::class, 'instance_id');
    }

    public function timelineEntries(): HasMany
    {
        return $this->hasMany(WorkflowTimelineEntry::class, 'instance_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(WorkflowNotification::class, 'instance_id');
    }
}
