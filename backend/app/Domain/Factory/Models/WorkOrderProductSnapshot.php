<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOrderProductSnapshot extends Model
{
    protected $fillable = [
        'work_order_id',
        'product_id',
        'snapshot_data',
        'captured_at',
    ];

    protected function casts(): array
    {
        return [
            'snapshot_data' => 'array',
            'captured_at' => 'datetime',
        ];
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
