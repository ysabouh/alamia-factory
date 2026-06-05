<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductMold extends Model
{
    protected $fillable = [
        'product_id',
        'mold_id',
        'priority',
        'is_default',
        'notes',
    ];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }
}
