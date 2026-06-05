<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlowMachineSpec extends Model
{
    protected $fillable = [
        'machine_id',
        'bottle_volume_min_ml',
        'bottle_volume_max_ml',
        'cavities_count',
        'air_pressure_bar',
        'production_capacity_bph',
    ];

    protected function casts(): array
    {
        return [
            'air_pressure_bar' => 'decimal:2',
        ];
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }
}
