<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\WorkflowTransitionConditionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowStageTransition extends Model
{
    protected $fillable = [
        'template_version_id',
        'from_stage_id',
        'to_stage_id',
        'from_gateway_node_id',
        'condition_type',
        'label',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'condition_type' => WorkflowTransitionConditionType::class,
        ];
    }

    public function templateVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplateVersion::class, 'template_version_id');
    }

    public function fromStage(): BelongsTo
    {
        return $this->belongsTo(WorkflowStage::class, 'from_stage_id');
    }

    public function toStage(): BelongsTo
    {
        return $this->belongsTo(WorkflowStage::class, 'to_stage_id');
    }
}
