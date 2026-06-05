<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OvertimeRequest extends Model
{
    use SoftDeletes;
    use TracksAuditorColumns;

    protected $fillable = [
        'employee_id',
        'supervisor_id',
        'overtime_date',
        'start_time',
        'end_time',
        'duration_hours',
        'weighted_hours',
        'rate_multiplier',
        'approved_hours',
        'reason',
        'assignment_reason',
        'status',
        'approved_at',
        'rejected_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'overtime_date' => 'date',
            'duration_hours' => 'decimal:2',
            'weighted_hours' => 'decimal:2',
            'rate_multiplier' => 'decimal:2',
            'approved_hours' => 'decimal:2',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(OvertimeRequestStatusLog::class)->orderBy('created_at');
    }
}
