<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductMachineSetting extends Model
{
    protected $fillable = [
        'product_id',
        'machine_id',
        'cycle_time',
        'injection_pressure',
        'holding_pressure',
        'cooling_time',
        'mold_temperature',
        'barrel_temperature_profile',
        'shot_weight',
        'clamp_force',
        'back_pressure',
        'screw_speed',
        'setup_notes',
    ];

    protected function casts(): array
    {
        return [
            'injection_pressure' => 'decimal:2',
            'holding_pressure' => 'decimal:2',
            'mold_temperature' => 'decimal:2',
            'barrel_temperature_profile' => 'array',
            'shot_weight' => 'decimal:3',
            'clamp_force' => 'decimal:2',
            'back_pressure' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }
}
