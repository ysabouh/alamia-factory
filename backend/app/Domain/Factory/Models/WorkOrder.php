<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\WorkOrderStatus;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkOrder extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'product_id',
        'code',
        'order_no',
        'production_date',
        'machine_id',
        'mold_id',
        'shift_id',
        'supervisor_id',
        'production_manager_id',
        'target_quantity',
        'planned_quantity',
        'priority',
        'status',
        'due_date',
        'start_time',
        'end_time',
        'product_operation_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => WorkOrderStatus::class,
            'due_date' => 'date',
            'production_date' => 'date',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'supervisor_id');
    }

    public function productionManager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'production_manager_id');
    }

    public function productOperation(): BelongsTo
    {
        return $this->belongsTo(ProductOperation::class);
    }

    public function workers(): HasMany
    {
        return $this->hasMany(WorkOrderWorker::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ProductionLog::class);
    }

    public function productionEntries(): HasMany
    {
        return $this->hasMany(ProductionEntry::class);
    }

    public function inspections(): HasMany
    {
        return $this->hasMany(QualityInspection::class);
    }

    public function downtimes(): HasMany
    {
        return $this->hasMany(MachineDowntime::class);
    }
}
