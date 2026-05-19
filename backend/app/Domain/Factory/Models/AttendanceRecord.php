<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AttendanceRecord extends Model
{
    use SoftDeletes;
    use TracksAuditorColumns;

    protected $fillable = [
        'employee_id',
        'attendance_date',
        'check_in',
        'check_out',
        'overtime_from',
        'worked_minutes',
        'overtime_minutes',
        'friday_overtime_minutes',
        'late_minutes',
        'early_leave_minutes',
        'attendance_status',
        'hourly_rate',
        'overtime_hourly_rate',
        'friday_hourly_rate',
        'regular_pay',
        'overtime_pay',
        'friday_overtime_pay',
        'total_pay',
        'approved_by_supervisor_id',
        'approved_at',
        'notes',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'attendance_date' => 'date',
            'check_in' => 'datetime',
            'check_out' => 'datetime',
            'approved_at' => 'datetime',
            'hourly_rate' => 'decimal:4',
            'overtime_hourly_rate' => 'decimal:4',
            'friday_hourly_rate' => 'decimal:4',
            'regular_pay' => 'decimal:2',
            'overtime_pay' => 'decimal:2',
            'friday_overtime_pay' => 'decimal:2',
            'total_pay' => 'decimal:2',
        ]);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function approvedBySupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_supervisor_id');
    }
}
