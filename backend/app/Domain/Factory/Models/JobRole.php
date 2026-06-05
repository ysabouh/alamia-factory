<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobRole extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'name',
        'code',
        'role_level',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'role_level' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
