<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationMaterialConsumption extends Model
{
    protected $table = 'operation_material_consumption';

    protected $fillable = [
        'product_operation_id',
        'material_product_id',
        'planned_quantity',
        'actual_quantity',
        'waste_quantity',
    ];

    protected function casts(): array
    {
        return [
            'planned_quantity' => 'decimal:4',
            'actual_quantity' => 'decimal:4',
            'waste_quantity' => 'decimal:4',
        ];
    }

    public function operation(): BelongsTo
    {
        return $this->belongsTo(ProductOperation::class, 'product_operation_id');
    }

    public function materialProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'material_product_id');
    }
}
