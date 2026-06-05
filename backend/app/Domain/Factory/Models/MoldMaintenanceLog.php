<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoldMaintenanceLog extends Model
{
    protected $fillable = [
        'mold_id',
        'maintenance_type',
        'description',
        'technician',
        'maintenance_date',
        'cost',
        'next_maintenance_date',
    ];

    protected function casts(): array
    {
        return [
            'maintenance_date' => 'date',
            'next_maintenance_date' => 'date',
            'cost' => 'decimal:2',
        ];
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }
}
