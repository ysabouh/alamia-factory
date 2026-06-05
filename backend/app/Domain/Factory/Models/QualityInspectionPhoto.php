<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QualityInspectionPhoto extends Model
{
    protected $fillable = [
        'quality_inspection_id',
        'file_path',
        'file_name',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function inspection(): BelongsTo
    {
        return $this->belongsTo(QualityInspection::class, 'quality_inspection_id');
    }
}
