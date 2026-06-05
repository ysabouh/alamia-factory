<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\MaintenanceTicketKind;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceTicket extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'request_no',
        'machine_id',
        'work_order_id',
        'machine_downtime_id',
        'ticket_kind',
        'reported_by_id',
        'assigned_technician_id',
        'severity',
        'status',
        'title',
        'description',
        'failure_date',
        'downtime_started_at',
        'downtime_ended_at',
        'resolved_at',
        'downtime_minutes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'ticket_kind' => MaintenanceTicketKind::class,
            'failure_date' => 'date',
            'downtime_started_at' => 'datetime',
            'downtime_ended_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function machineDowntime(): BelongsTo
    {
        return $this->belongsTo(MachineDowntime::class);
    }

    public function assignedTechnician(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_technician_id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(MaintenanceAction::class);
    }
}
