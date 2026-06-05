<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventoryTransaction extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'warehouse_id',
        'storage_location_id',
        'item_type',
        'item_id',
        'transaction_type',
        'quantity',
        'unit',
        'reference_type',
        'reference_id',
        'created_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
        ];
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
