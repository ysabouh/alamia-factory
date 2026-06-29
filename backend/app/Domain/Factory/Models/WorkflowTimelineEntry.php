<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\WorkflowTimelineAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowTimelineEntry extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'instance_id',
        'task_id',
        'action',
        'actor_id',
        'notes',
        'meta',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'action' => WorkflowTimelineAction::class,
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function instance(): BelongsTo
    {
        return $this->belongsTo(WorkflowInstance::class, 'instance_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(WorkflowTask::class, 'task_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
