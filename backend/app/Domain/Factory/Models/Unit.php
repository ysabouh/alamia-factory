<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    protected $fillable = [
        'unit_code',
        'unit_name_ar',
        'unit_name_en',
        'symbol',
        'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'unit_id');
    }
}
