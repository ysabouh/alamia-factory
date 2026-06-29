<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\DirectTaskCategory;
use App\Domain\Factory\Enums\DirectTaskPriority;
use App\Domain\Factory\Enums\DirectTaskType;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DirectTaskSchedule extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'schedule_number',
        'title',
        'description',
        'category',
        'priority',
        'task_type',
        'start_date',
        'execution_time',
        'expected_duration_minutes',
        'reminder_minutes_before',
        'repeat_every',
        'weekdays',
        'month_day',
        'options',
        'notes',
        'next_run_at',
        'last_run_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'category' => DirectTaskCategory::class,
            'priority' => DirectTaskPriority::class,
            'task_type' => DirectTaskType::class,
            'start_date' => 'date',
            'weekdays' => 'array',
            'options' => 'array',
            'next_run_at' => 'datetime',
            'last_run_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(DirectTask::class, 'schedule_id');
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(DirectTaskChecklistItem::class, 'schedule_id')->orderBy('sort_order');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(DirectTaskAssignment::class, 'schedule_id');
    }
}
