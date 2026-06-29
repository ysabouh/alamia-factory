<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\DirectTaskChecklistItemType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DirectTaskChecklistItem extends Model
{
    protected $fillable = [
        'schedule_id',
        'task_id',
        'label',
        'item_type',
        'is_required',
        'sort_order',
        'is_completed',
        'response_value',
    ];

    protected function casts(): array
    {
        return [
            'item_type' => DirectTaskChecklistItemType::class,
            'is_required' => 'boolean',
            'is_completed' => 'boolean',
        ];
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(DirectTaskSchedule::class, 'schedule_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(DirectTask::class, 'task_id');
    }
}
