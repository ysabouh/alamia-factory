<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockLevel extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'warehouse_id',
        'storage_location_id',
        'item_type',
        'item_id',
        'quantity',
        'unit',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'quantity' => 'decimal:3',
        ]);
    }

    public function item(): MorphTo
    {
        return $this->morphTo();
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
