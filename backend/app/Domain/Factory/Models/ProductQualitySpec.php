<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductQualitySpec extends Model
{
    protected $fillable = [
        'product_id',
        'weight_tolerance',
        'thickness_tolerance',
        'color_tolerance',
        'pressure_test_required',
        'leak_test_required',
        'drop_test_required',
        'visual_inspection_required',
        'qc_notes',
    ];

    protected function casts(): array
    {
        return [
            'weight_tolerance' => 'decimal:3',
            'thickness_tolerance' => 'decimal:3',
            'color_tolerance' => 'decimal:3',
            'pressure_test_required' => 'boolean',
            'leak_test_required' => 'boolean',
            'drop_test_required' => 'boolean',
            'visual_inspection_required' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
