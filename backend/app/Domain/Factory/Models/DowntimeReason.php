<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DowntimeReason extends Model
{
    protected $fillable = [
        'code',
        'name',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function downtimes(): HasMany
    {
        return $this->hasMany(MachineDowntime::class, 'downtime_reason_id');
    }
}
