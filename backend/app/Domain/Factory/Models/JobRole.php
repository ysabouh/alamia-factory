<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobRole extends Model
{
    protected $fillable = [
        'name',
        'code',
        'role_level',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'role_level' => 'integer',
        ];
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }
}
