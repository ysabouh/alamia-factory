<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'name',
        'code',
        'starts_at',
        'ends_at',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'starts_at' => 'datetime:H:i',
            'ends_at' => 'datetime:H:i',
            'is_active' => 'boolean',
        ]);
    }
}
