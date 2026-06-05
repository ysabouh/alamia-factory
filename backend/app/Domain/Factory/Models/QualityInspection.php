<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\InspectionStatus;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QualityInspection extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'work_order_id',
        'production_entry_id',
        'quality_employee_id',
        'inspector_id',
        'inspection_time',
        'status',
        'result',
        'sample_size',
        'notes',
        'corrective_action',
        'is_final',
    ];

    protected function casts(): array
    {
        return [
            'status' => InspectionStatus::class,
            'inspection_time' => 'datetime',
            'is_final' => 'boolean',
        ];
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function productionEntry(): BelongsTo
    {
        return $this->belongsTo(ProductionEntry::class);
    }

    public function qualityEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'quality_employee_id');
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'inspector_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(QualityInspectionResult::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(QualityInspectionPhoto::class);
    }

    public function defectLinks(): HasMany
    {
        return $this->hasMany(QualityInspectionDefect::class);
    }

    /** @deprecated use defectLinks */
    public function defects(): HasMany
    {
        return $this->defectLinks();
    }
}
