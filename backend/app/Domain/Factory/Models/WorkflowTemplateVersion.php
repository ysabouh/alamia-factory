<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\WorkflowTemplateVersionStatus;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowTemplateVersion extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'template_id',
        'version',
        'status',
        'definition_json',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => WorkflowTemplateVersionStatus::class,
            'definition_json' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplate::class, 'template_id');
    }

    public function stages(): HasMany
    {
        return $this->hasMany(WorkflowStage::class, 'template_version_id')->orderBy('stage_number');
    }

    public function transitions(): HasMany
    {
        return $this->hasMany(WorkflowStageTransition::class, 'template_version_id')->orderBy('sort_order');
    }

    public function instances(): HasMany
    {
        return $this->hasMany(WorkflowInstance::class, 'template_version_id');
    }
}
