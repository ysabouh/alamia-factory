<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssemblyComponentConsumption extends Model
{
    protected $table = 'assembly_components_consumption';

    protected $fillable = [
        'assembly_operation_id',
        'component_product_id',
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
        return $this->belongsTo(AssemblyOperation::class, 'assembly_operation_id');
    }

    public function componentProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'component_product_id');
    }
}
