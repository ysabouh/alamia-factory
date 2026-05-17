<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOrder extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'product_id',
        'code',
        'target_quantity',
        'priority',
        'status',
        'due_date',
        'notes',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'due_date' => 'date',
        ]);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
