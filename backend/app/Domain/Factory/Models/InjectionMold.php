<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InjectionMold extends Model
{
    protected $fillable = [
        'mold_id',
        'hot_runner',
        'runner_type',
        'gate_type',
        'cooling_circuit_count',
        'ejector_system_type',
        'max_injection_pressure',
        'clamp_force_required',
        'cycle_time',
        'mold_steel_type',
        'shrinkage_rate',
        'core_pull_count',
        'texture_type',
        'supported_materials',
    ];

    protected function casts(): array
    {
        return [
            'hot_runner' => 'boolean',
            'supported_materials' => 'array',
            'max_injection_pressure' => 'decimal:2',
            'clamp_force_required' => 'decimal:2',
            'cycle_time' => 'decimal:2',
            'shrinkage_rate' => 'decimal:4',
        ];
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }
}
