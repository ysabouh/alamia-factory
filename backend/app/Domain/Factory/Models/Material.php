<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'code',
        'name',
        'category',
        'unit',
        'minimum_stock',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'minimum_stock' => 'decimal:3',
            'is_active' => 'boolean',
        ]);
    }
}
