<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InjectionMachineSpec extends Model
{
    protected $fillable = [
        'machine_id',
        'clamping_force_ton',
        'shot_weight_gram',
        'screw_diameter_mm',
        'injection_pressure_bar',
        'heating_zones_count',
        'max_cycle_time_sec',
    ];

    protected function casts(): array
    {
        return [
            'clamping_force_ton' => 'decimal:2',
            'shot_weight_gram' => 'decimal:2',
            'screw_diameter_mm' => 'decimal:2',
            'injection_pressure_bar' => 'decimal:2',
            'max_cycle_time_sec' => 'decimal:2',
        ];
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }
}
