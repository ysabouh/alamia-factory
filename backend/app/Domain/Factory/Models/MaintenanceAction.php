<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceAction extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'maintenance_ticket_id',
        'technician_id',
        'action_taken',
        'parts_used',
        'time_spent_minutes',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'parts_used' => 'array',
        ]);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(MaintenanceTicket::class, 'maintenance_ticket_id');
    }
}
