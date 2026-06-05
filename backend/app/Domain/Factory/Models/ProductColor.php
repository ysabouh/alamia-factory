<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductColor extends Model
{
    protected $fillable = [
        'color_code',
        'color_name',
        'hex_color',
        'masterbatch_reference',
        'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'color_id');
    }
}
