<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\WorkflowAssignmentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowStage extends Model
{
    protected $fillable = [
        'template_version_id',
        'stage_number',
        'name',
        'description',
        'estimated_duration_minutes',
        'sla_duration_minutes',
        'assignment_type',
        'assignment_config',
        'requires_approval',
        'allow_rejection',
        'allow_return',
        'checklist_required',
        'required_attachments',
        'next_stage_id',
        'position_x',
        'position_y',
        'node_id',
    ];

    protected function casts(): array
    {
        return [
            'assignment_type' => WorkflowAssignmentType::class,
            'assignment_config' => 'array',
            'required_attachments' => 'array',
            'requires_approval' => 'boolean',
            'allow_rejection' => 'boolean',
            'allow_return' => 'boolean',
            'checklist_required' => 'boolean',
        ];
    }

    public function templateVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplateVersion::class, 'template_version_id');
    }

    public function nextStage(): BelongsTo
    {
        return $this->belongsTo(self::class, 'next_stage_id');
    }

    public function outgoingTransitions(): HasMany
    {
        return $this->hasMany(WorkflowStageTransition::class, 'from_stage_id')->orderBy('sort_order');
    }

    public function incomingTransitions(): HasMany
    {
        return $this->hasMany(WorkflowStageTransition::class, 'to_stage_id');
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(WorkflowStageChecklistItem::class, 'stage_id')->orderBy('sort_order');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(WorkflowTask::class, 'stage_id');
    }
}
