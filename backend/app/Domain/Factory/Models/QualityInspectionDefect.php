<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QualityInspectionDefect extends Model
{
    protected $fillable = [
        'quality_inspection_id',
        'defect_id',
        'quantity',
        'notes',
    ];

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(QualityInspection::class, 'quality_inspection_id');
    }

    public function defect(): BelongsTo
    {
        return $this->belongsTo(QualityDefect::class, 'defect_id');
    }
}
