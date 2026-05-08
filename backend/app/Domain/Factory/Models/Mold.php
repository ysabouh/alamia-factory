<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mold extends Model
{
    protected $fillable = [
        'product_id',
        'code',
        'name',
        'cavity_count',
        'default_cycle_seconds',
        'expected_piece_weight_grams',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'expected_piece_weight_grams' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
