<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\OperationType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProductOperation extends Model
{
    protected $fillable = [
        'product_id',
        'operation_code',
        'operation_name',
        'operation_type',
        'sequence_order',
        'machine_id',
        'mold_id',
        'work_center_id',
        'setup_time',
        'cycle_time',
        'labor_time',
        'cooling_time',
        'operation_instructions',
        'qc_required',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'operation_type' => OperationType::class,
            'qc_required' => 'boolean',
            'is_active' => 'boolean',
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

    public function workCenter(): BelongsTo
    {
        return $this->belongsTo(WorkCenter::class);
    }

    public function machineSettings(): HasMany
    {
        return $this->hasMany(OperationMachineSetting::class);
    }

    public function primaryMachineSetting(): HasOne
    {
        return $this->hasOne(OperationMachineSetting::class)->oldestOfMany();
    }

    public function materialConsumptions(): HasMany
    {
        return $this->hasMany(OperationMaterialConsumption::class);
    }

    public function qualitySpecs(): HasMany
    {
        return $this->hasMany(OperationQualitySpec::class);
    }
}
