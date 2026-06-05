<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\PetBlowType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PetBlowMold extends Model
{
    protected $fillable = [
        'mold_id',
        'blow_type',
        'bottle_volume_ml',
        'neck_diameter',
        'cooling_method',
        'air_pressure_required',
        'blow_ratio',
        'parison_type',
        'cooling_time',
        'mold_material',
        'supported_polymers',
        'max_temperature',
    ];

    protected function casts(): array
    {
        return [
            'blow_type' => PetBlowType::class,
            'supported_polymers' => 'array',
            'neck_diameter' => 'decimal:2',
            'air_pressure_required' => 'decimal:2',
            'blow_ratio' => 'decimal:3',
            'cooling_time' => 'decimal:2',
            'max_temperature' => 'decimal:2',
        ];
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }
}
