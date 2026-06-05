<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionLog extends Model
{
    protected $fillable = [
        'work_order_id',
        'from_time',
        'to_time',
        'good_quantity',
        'scrap_quantity',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'from_time' => 'datetime',
            'to_time' => 'datetime',
        ];
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
