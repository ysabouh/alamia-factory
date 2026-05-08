<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'code',
        'name',
        'unit',
        'standard_weight_grams',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'standard_weight_grams' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }
}
