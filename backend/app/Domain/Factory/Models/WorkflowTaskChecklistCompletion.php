<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowTaskChecklistCompletion extends Model
{
    protected $fillable = [
        'task_id',
        'checklist_item_id',
        'is_completed',
        'completed_by',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(WorkflowTask::class, 'task_id');
    }

    public function checklistItem(): BelongsTo
    {
        return $this->belongsTo(WorkflowStageChecklistItem::class, 'checklist_item_id');
    }

    public function completedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
