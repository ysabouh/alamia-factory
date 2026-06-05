<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'code',
        'name',
        'phone',
        'email',
        'address',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
