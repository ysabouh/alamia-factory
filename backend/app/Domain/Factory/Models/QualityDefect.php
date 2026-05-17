<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QualityDefect extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'quality_inspection_id',
        'defect_type',
        'quantity',
        'severity',
        'notes',
    ];

    protected function casts(): array
    {
        return self::auditorDateCasts();
    }

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(QualityInspection::class, 'quality_inspection_id');
    }
}
