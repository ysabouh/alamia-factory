<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\PeProductionMethod;
use App\Domain\Factory\Enums\PolyethyleneType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PolyethyleneMold extends Model
{
    protected $fillable = [
        'mold_id',
        'polyethylene_type',
        'production_method',
        'tank_volume',
        'wall_thickness',
        'cooling_method',
        'mold_material',
        'heating_system',
        'cycle_time',
        'pressure_rating',
        'supported_products',
        'max_temperature',
        'min_temperature',
        'mold_layers',
        'rotational_speed',
        'shrinkage_rate',
    ];

    protected function casts(): array
    {
        return [
            'polyethylene_type' => PolyethyleneType::class,
            'production_method' => PeProductionMethod::class,
            'supported_products' => 'array',
            'tank_volume' => 'decimal:3',
            'wall_thickness' => 'decimal:3',
            'cycle_time' => 'decimal:2',
            'pressure_rating' => 'decimal:2',
            'max_temperature' => 'decimal:2',
            'min_temperature' => 'decimal:2',
            'rotational_speed' => 'decimal:2',
            'shrinkage_rate' => 'decimal:4',
        ];
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }
}
