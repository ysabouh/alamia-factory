<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\ProductDocumentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductDocument extends Model
{
    protected $fillable = [
        'product_id',
        'document_name',
        'document_type',
        'file_url',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'document_type' => ProductDocumentType::class,
            'uploaded_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
