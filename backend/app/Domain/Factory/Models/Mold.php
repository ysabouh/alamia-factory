<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\MoldStatus;
use App\Domain\Factory\Enums\MoldType;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mold extends Model
{
    use SoftDeletes;
    use TracksAuditorColumns;

    protected $fillable = [
        'product_id',
        'code',
        'name',
        'mold_type',
        'status',
        'cavity_count',
        'product_name',
        'material_type',
        'machine_id',
        'manufacturer',
        'manufacturing_country',
        'manufacturing_date',
        'purchase_date',
        'purchase_cost',
        'mold_weight',
        'mold_dimensions',
        'expected_life_cycles',
        'total_cycles',
        'current_location',
        'maintenance_cycle',
        'last_maintenance_date',
        'next_maintenance_date',
        'image_url',
        'notes',
        'default_cycle_seconds',
        'expected_piece_weight_grams',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'mold_type' => MoldType::class,
            'status' => MoldStatus::class,
            'expected_piece_weight_grams' => 'decimal:3',
            'purchase_cost' => 'decimal:2',
            'mold_weight' => 'decimal:3',
            'manufacturing_date' => 'date',
            'purchase_date' => 'date',
            'last_maintenance_date' => 'date',
            'next_maintenance_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_molds')
            ->withPivot(['priority', 'is_default', 'notes'])
            ->withTimestamps();
    }

    public function productMolds(): HasMany
    {
        return $this->hasMany(ProductMold::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function injectionSpec(): HasOne
    {
        return $this->hasOne(InjectionMold::class);
    }

    public function petBlowSpec(): HasOne
    {
        return $this->hasOne(PetBlowMold::class);
    }

    public function compressionSpec(): HasOne
    {
        return $this->hasOne(CompressionMold::class);
    }

    public function polyethyleneSpec(): HasOne
    {
        return $this->hasOne(PolyethyleneMold::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(MoldImage::class)->orderByDesc('is_primary')->orderByDesc('uploaded_at');
    }

    public function maintenanceLogs(): HasMany
    {
        return $this->hasMany(MoldMaintenanceLog::class)->orderByDesc('maintenance_date');
    }

    public function installations(): HasMany
    {
        return $this->hasMany(MoldInstallation::class)->orderByDesc('installed_at');
    }

    public function activeInstallation(): HasOne
    {
        return $this->hasOne(MoldInstallation::class)->whereNull('removed_at')->latestOfMany('installed_at');
    }
}
