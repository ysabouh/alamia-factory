<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\InspectionResultStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QualityInspectionResult extends Model
{
    protected $fillable = [
        'quality_inspection_id',
        'checklist_item_id',
        'measured_value',
        'result_status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'result_status' => InspectionResultStatus::class,
        ];
    }

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(QualityInspection::class, 'quality_inspection_id');
    }

    public function checklistItem(): BelongsTo
    {
        return $this->belongsTo(QualityChecklistItem::class, 'checklist_item_id');
    }
}
