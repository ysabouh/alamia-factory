<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MachineCounter extends Model
{
    protected $fillable = [
        'machine_id',
        'counter_date',
        'produced_units',
        'rejected_units',
        'running_hours',
    ];

    protected function casts(): array
    {
        return [
            'counter_date' => 'date',
            'running_hours' => 'decimal:2',
        ];
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }
}
