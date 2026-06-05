<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\ChecklistItemType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QualityChecklistItem extends Model
{
    protected $fillable = [
        'checklist_id',
        'item_name',
        'item_type',
        'min_value',
        'max_value',
        'unit',
        'selection_options',
        'sort_order',
        'is_required',
        'is_critical',
    ];

    protected function casts(): array
    {
        return [
            'item_type' => ChecklistItemType::class,
            'min_value' => 'decimal:4',
            'max_value' => 'decimal:4',
            'selection_options' => 'array',
            'is_required' => 'boolean',
            'is_critical' => 'boolean',
        ];
    }

    public function checklist(): BelongsTo
    {
        return $this->belongsTo(QualityChecklist::class, 'checklist_id');
    }
}
