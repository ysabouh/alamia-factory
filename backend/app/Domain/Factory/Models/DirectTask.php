<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\DirectTaskCategory;
use App\Domain\Factory\Enums\DirectTaskPriority;
use App\Domain\Factory\Enums\DirectTaskStatus;
use App\Domain\Factory\Enums\DirectTaskType;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DirectTask extends Model
{
    use SoftDeletes;
    use TracksAuditorColumns;

    protected $fillable = [
        'task_number',
        'schedule_id',
        'title',
        'description',
        'category',
        'priority',
        'task_type',
        'status',
        'start_date',
        'execution_time',
        'due_at',
        'expected_duration_minutes',
        'reminder_at',
        'options',
        'notes',
        'started_at',
        'completed_at',
        'is_overdue',
    ];

    protected function casts(): array
    {
        return [
            'category' => DirectTaskCategory::class,
            'priority' => DirectTaskPriority::class,
            'task_type' => DirectTaskType::class,
            'status' => DirectTaskStatus::class,
            'start_date' => 'date',
            'due_at' => 'datetime',
            'reminder_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'options' => 'array',
            'is_overdue' => 'boolean',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(DirectTaskSchedule::class, 'schedule_id');
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(DirectTaskChecklistItem::class, 'task_id')->orderBy('sort_order');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(DirectTaskAssignment::class, 'task_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(DirectTaskAttachment::class, 'task_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(DirectTaskComment::class, 'task_id')->latest();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
