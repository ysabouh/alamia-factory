<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MachineDowntime extends Model
{
    protected $fillable = [
        'work_order_id',
        'machine_id',
        'start_time',
        'end_time',
        'downtime_minutes',
        'downtime_reason_id',
        'notes',
        'fault_description',
        'repair_method',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function reason(): BelongsTo
    {
        return $this->belongsTo(DowntimeReason::class, 'downtime_reason_id');
    }

    public function maintenanceTicket(): HasOne
    {
        return $this->hasOne(MaintenanceTicket::class, 'machine_downtime_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(MachineDowntimePhoto::class)->orderBy('uploaded_at');
    }
}
