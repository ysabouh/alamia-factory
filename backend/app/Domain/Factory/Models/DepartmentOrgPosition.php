<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DepartmentOrgPosition extends Model
{
    protected $fillable = [
        'department_id',
        'name',
        'code',
        'description',
        'sort_order',
        'planned_headcount',
        'vacancy_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
            'planned_headcount' => 'integer',
            'vacancy_count' => 'integer',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'org_position_id');
    }
}
