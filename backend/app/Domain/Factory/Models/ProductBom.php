<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\BomComponentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class ProductBom extends Model
{
    protected $table = 'product_bom';

    protected $fillable = [
        'product_id',
        'child_product_id',
        'material_product_id',
        'quantity',
        'unit_id',
        'component_type',
        'waste_percentage',
        'is_optional',
        'sequence_order',
        'notes',
    ];

    protected static function booted(): void
    {
        static::creating(function (ProductBom $line): void {
            if ($line->child_product_id && Schema::hasColumn('product_bom', 'material_product_id')) {
                $line->material_product_id = $line->child_product_id;
            }
        });

        static::updating(function (ProductBom $line): void {
            if ($line->isDirty('child_product_id') && Schema::hasColumn('product_bom', 'material_product_id')) {
                $line->material_product_id = $line->child_product_id;
            }
        });
    }

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'waste_percentage' => 'decimal:2',
            'component_type' => BomComponentType::class,
            'is_optional' => 'boolean',
        ];
    }

    public function parentProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /** @deprecated use childProduct() */
    public function product(): BelongsTo
    {
        return $this->parentProduct();
    }

    public function childProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'child_product_id');
    }

    /** @deprecated use childProduct() */
    public function materialProduct(): BelongsTo
    {
        return $this->childProduct();
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
