<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QualityDefect extends Model
{
    protected $fillable = [
        'quality_inspection_id',
        'defect_type',
        'quantity',
        'severity',
        'notes',
    ];

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(QualityInspection::class, 'quality_inspection_id');
    }
}
