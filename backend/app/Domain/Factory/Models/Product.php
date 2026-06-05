<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\AssemblyType;
use App\Domain\Factory\Enums\ManufacturingMode;
use App\Domain\Factory\Enums\ManufacturingType;
use App\Domain\Factory\Enums\ProductStatus;
use App\Domain\Factory\Enums\ProductType;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'code',
        'name',
        'unit',
        'standard_weight_grams',
        'standard_cost',
        'product_code',
        'sku',
        'barcode',
        'product_name_ar',
        'product_name_en',
        'short_name',
        'category_id',
        'product_type',
        'assembly_type',
        'manufacturing_mode',
        'manufacturing_type',
        'plastic_material_id',
        'color_id',
        'unit_id',
        'product_weight',
        'product_volume',
        'dimensions',
        'cavity_output',
        'standard_cycle_time',
        'target_output_per_hour',
        'product_status',
        'image_url',
        'technical_notes',
        'is_active',
        'tenant_id',
        'factory_id',
        'branch_id',
    ];

    protected function casts(): array
    {
        return [
            'standard_weight_grams' => 'decimal:3',
            'product_weight' => 'decimal:3',
            'product_volume' => 'decimal:3',
            'product_type' => ProductType::class,
            'assembly_type' => AssemblyType::class,
            'manufacturing_mode' => ManufacturingMode::class,
            'manufacturing_type' => ManufacturingType::class,
            'product_status' => ProductStatus::class,
            'standard_cost' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Product $product): void {
            if ($product->product_code) {
                $product->code = $product->product_code;
            } elseif ($product->code) {
                $product->product_code = $product->code;
            }
            if ($product->product_name_ar) {
                $product->name = $product->product_name_ar;
            } elseif ($product->name) {
                $product->product_name_ar = $product->name;
            }
            if ($product->isDirty('unit_id') && $product->unit_id) {
                $unit = Unit::query()->find($product->unit_id);
                if ($unit) {
                    $product->unit = $unit->unit_code;
                }
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function plasticMaterial(): BelongsTo
    {
        return $this->belongsTo(PlasticMaterial::class, 'plastic_material_id');
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(ProductColor::class, 'color_id');
    }

    public function measureUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProductDocument::class);
    }

    public function bomLines(): HasMany
    {
        return $this->hasMany(ProductBom::class);
    }

    public function bomAsMaterial(): HasMany
    {
        return $this->hasMany(ProductBom::class, 'child_product_id');
    }

    public function usedInBoms(): HasMany
    {
        return $this->bomAsMaterial();
    }

    public function qualitySpec(): HasOne
    {
        return $this->hasOne(ProductQualitySpec::class);
    }

    public function productMolds(): HasMany
    {
        return $this->hasMany(ProductMold::class);
    }

    public function molds(): BelongsToMany
    {
        return $this->belongsToMany(Mold::class, 'product_molds')
            ->withPivot(['priority', 'is_default', 'notes'])
            ->withTimestamps();
    }

    public function machineSettings(): HasMany
    {
        return $this->hasMany(ProductMachineSetting::class);
    }

    public function operations(): HasMany
    {
        return $this->hasMany(ProductOperation::class)->orderBy('sequence_order');
    }

    public function moldsLegacy(): HasMany
    {
        return $this->hasMany(Mold::class, 'product_id');
    }

    public function workOrders(): HasMany
    {
        return $this->hasMany(WorkOrder::class);
    }
}
