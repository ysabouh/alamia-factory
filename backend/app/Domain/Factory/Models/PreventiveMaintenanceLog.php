<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PreventiveMaintenanceLog extends Model
{
    protected $fillable = [
        'preventive_maintenance_plan_id',
        'technician_id',
        'performed_at',
        'checklist_result',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'performed_at' => 'datetime',
            'checklist_result' => 'array',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(PreventiveMaintenancePlan::class, 'preventive_maintenance_plan_id');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'technician_id');
    }
}
