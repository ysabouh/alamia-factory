<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompressionMold extends Model
{
    protected $fillable = [
        'mold_id',
        'compression_force',
        'heating_type',
        'mold_temperature',
        'pressure_time',
        'curing_time',
        'mold_material',
        'heating_zones',
        'supported_materials',
        'max_product_thickness',
    ];

    protected function casts(): array
    {
        return [
            'supported_materials' => 'array',
            'compression_force' => 'decimal:2',
            'mold_temperature' => 'decimal:2',
            'pressure_time' => 'decimal:2',
            'curing_time' => 'decimal:2',
            'max_product_thickness' => 'decimal:2',
        ];
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }
}
