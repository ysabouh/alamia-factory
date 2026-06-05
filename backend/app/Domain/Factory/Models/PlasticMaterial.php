<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlasticMaterial extends Model
{
    protected $fillable = [
        'material_code',
        'material_name',
        'density',
        'melt_temperature',
        'drying_temperature',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'density' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'plastic_material_id');
    }
}
