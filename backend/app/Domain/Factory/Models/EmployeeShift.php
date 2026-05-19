<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeShift extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'employee_id',
        'shift_id',
        'effective_from',
        'effective_to',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'effective_from' => 'date',
            'effective_to' => 'date',
            'is_active' => 'boolean',
        ]);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
