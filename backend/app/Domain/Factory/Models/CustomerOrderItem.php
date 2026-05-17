<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerOrderItem extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'customer_order_id',
        'product_id',
        'quantity',
        'unit_price',
        'notes',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'quantity' => 'decimal:3',
            'unit_price' => 'decimal:2',
        ]);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CustomerOrder::class, 'customer_order_id');
    }
}
