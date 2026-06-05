<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\MaintenanceActionType;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceAction extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'maintenance_ticket_id',
        'maintenance_type',
        'maintenance_date',
        'technician_id',
        'action_taken',
        'parts_used',
        'time_spent_minutes',
        'cost',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'maintenance_type' => MaintenanceActionType::class,
            'maintenance_date' => 'date',
            'parts_used' => 'array',
            'cost' => 'decimal:2',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(MaintenanceTicket::class, 'maintenance_ticket_id');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'technician_id');
    }
}
