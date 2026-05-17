<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\MachineStatus;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Machine extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'machine_type_id',
        'code',
        'name',
        'capacity',
        'location',
        'status',
        'status_note',
        'last_status_changed_at',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'status' => MachineStatus::class,
            'last_status_changed_at' => 'datetime',
        ]);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(MachineType::class, 'machine_type_id');
    }

    public function activeAssignment(): HasOne
    {
        return $this->hasOne(MachineAssignment::class)->whereNull('ended_at')->latestOfMany();
    }

    public function productionEntries(): HasMany
    {
        return $this->hasMany(ProductionEntry::class);
    }

    public function maintenanceTickets(): HasMany
    {
        return $this->hasMany(MaintenanceTicket::class);
    }
}
