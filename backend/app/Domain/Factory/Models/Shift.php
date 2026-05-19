<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shift extends Model
{
    use SoftDeletes;
    use TracksAuditorColumns;

    protected $fillable = [
        'name',
        'code',
        'starts_at',
        'ends_at',
        'break_minutes',
        'overtime_multiplier',
        'friday_multiplier',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'starts_at' => 'datetime:H:i',
            'ends_at' => 'datetime:H:i',
            'break_minutes' => 'integer',
            'overtime_multiplier' => 'decimal:2',
            'friday_multiplier' => 'decimal:2',
            'is_active' => 'boolean',
        ]);
    }

    public function employeeShifts(): HasMany
    {
        return $this->hasMany(EmployeeShift::class);
    }
}
