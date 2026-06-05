<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationMachineSetting extends Model
{
    protected $fillable = [
        'product_operation_id',
        'machine_id',
        'injection_pressure',
        'holding_pressure',
        'cooling_time',
        'mold_temperature',
        'barrel_temperature_profile',
        'clamp_force',
        'shot_weight',
        'screw_speed',
        'back_pressure',
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

    public function operation(): BelongsTo
    {
        return $this->belongsTo(ProductOperation::class, 'product_operation_id');
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }
}
