<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\ProductImageType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'image_url',
        'image_type',
        'is_primary',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'image_type' => ProductImageType::class,
            'is_primary' => 'boolean',
            'uploaded_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
