<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\AssemblyWorkOrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssemblyWorkOrder extends Model
{
    protected $fillable = [
        'work_order_code',
        'final_product_id',
        'planned_quantity',
        'completed_quantity',
        'status',
        'planned_start_date',
        'planned_end_date',
        'actual_start_date',
        'actual_end_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => AssemblyWorkOrderStatus::class,
            'planned_start_date' => 'date',
            'planned_end_date' => 'date',
            'actual_start_date' => 'datetime',
            'actual_end_date' => 'datetime',
        ];
    }

    public function finalProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'final_product_id');
    }

    public function operations(): HasMany
    {
        return $this->hasMany(AssemblyOperation::class);
    }
}
