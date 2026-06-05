<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssemblyOperation extends Model
{
    protected $fillable = [
        'assembly_work_order_id',
        'product_id',
        'quantity_produced',
        'quantity_rejected',
        'operator_id',
        'machine_id',
        'assembly_start_time',
        'assembly_end_time',
        'production_duration',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'assembly_start_time' => 'datetime',
            'assembly_end_time' => 'datetime',
        ];
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(AssemblyWorkOrder::class, 'assembly_work_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'operator_id');
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function consumptions(): HasMany
    {
        return $this->hasMany(AssemblyComponentConsumption::class);
    }
}
