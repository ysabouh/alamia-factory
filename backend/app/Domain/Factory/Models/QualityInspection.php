<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QualityInspection extends Model
{
    protected $fillable = [
        'production_entry_id',
        'inspector_id',
        'result',
        'sample_size',
        'notes',
    ];

    public function productionEntry(): BelongsTo
    {
        return $this->belongsTo(ProductionEntry::class);
    }

    public function defects(): HasMany
    {
        return $this->hasMany(QualityDefect::class);
    }
}
