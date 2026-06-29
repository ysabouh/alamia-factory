<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\WorkflowCategory;
use App\Domain\Factory\Enums\WorkflowPriority;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkflowTemplate extends Model
{
    use SoftDeletes;
    use TracksAuditorColumns;

    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'department_id',
        'is_active',
        'default_priority',
        'published_version_id',
    ];

    protected function casts(): array
    {
        return [
            'category' => WorkflowCategory::class,
            'default_priority' => WorkflowPriority::class,
            'is_active' => 'boolean',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function publishedVersion(): BelongsTo
    {
        return $this->belongsTo(WorkflowTemplateVersion::class, 'published_version_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(WorkflowTemplateVersion::class, 'template_id');
    }
}
