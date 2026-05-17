<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'code',
        'name',
        'unit',
        'standard_weight_grams',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'standard_weight_grams' => 'decimal:3',
            'is_active' => 'boolean',
        ]);
    }
}
