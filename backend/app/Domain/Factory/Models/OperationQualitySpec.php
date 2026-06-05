<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationQualitySpec extends Model
{
    protected $fillable = [
        'product_operation_id',
        'inspection_type',
        'tolerance_min',
        'tolerance_max',
        'inspection_frequency',
        'qc_notes',
    ];

    protected function casts(): array
    {
        return [
            'tolerance_min' => 'decimal:4',
            'tolerance_max' => 'decimal:4',
        ];
    }

    public function operation(): BelongsTo
    {
        return $this->belongsTo(ProductOperation::class, 'product_operation_id');
    }
}
