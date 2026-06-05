<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PreventiveMaintenancePlan extends Model
{
    protected $fillable = [
        'machine_id',
        'name',
        'interval_unit',
        'interval_value',
        'checklist',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'checklist' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(PreventiveMaintenanceLog::class);
    }
}
