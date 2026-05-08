<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\BelongsToFactoryUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceTicket extends Model
{
    use BelongsToFactoryUser;

    protected $fillable = [
        'machine_id',
        'reported_by_id',
        'assigned_technician_id',
        'severity',
        'status',
        'title',
        'description',
        'downtime_started_at',
        'downtime_ended_at',
        'created_by_id',
    ];

    protected function casts(): array
    {
        return [
            'downtime_started_at' => 'datetime',
            'downtime_ended_at' => 'datetime',
        ];
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
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
