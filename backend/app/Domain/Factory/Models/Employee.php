<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Employee extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'code',
        'employee_number',
        'name',
        'first_name',
        'last_name',
        'job_title',
        'department',
        'phone',
        'emergency_phone',
        'email',
        'gender',
        'birth_date',
        'national_id',
        'address',
        'hire_date',
        'hall_id',
        'department_id',
        'job_role_id',
        'shift_id',
        'employment_status_id',
        'basic_salary',
        'overtime_hour_rate',
        'overtime_friday_hour_rate',
        'performance_score',
        'reliability_score',
        'safety_score',
        'annual_leave_balance',
        'profile_image',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'is_active' => 'boolean',
            'birth_date' => 'date',
            'hire_date' => 'date',
            'basic_salary' => 'decimal:2',
            'overtime_hour_rate' => 'decimal:2',
            'overtime_friday_hour_rate' => 'decimal:2',
            'performance_score' => 'decimal:2',
            'reliability_score' => 'decimal:2',
            'safety_score' => 'decimal:2',
        ]);
    }

    protected $appends = [
        'full_name',
    ];

    public function getFullNameAttribute(): string
    {
        $assembled = trim((string) $this->first_name.' '.$this->last_name);

        return $assembled !== '' ? $assembled : (string) $this->name;
    }

    public function hall(): BelongsTo
    {
        return $this->belongsTo(Hall::class);
    }

    public function organizationalDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function jobRole(): BelongsTo
    {
        return $this->belongsTo(JobRole::class, 'job_role_id');
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }

    public function employmentStatus(): BelongsTo
    {
        return $this->belongsTo(EmploymentStatus::class, 'employment_status_id');
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function operatorAssignments(): HasMany
    {
        return $this->hasMany(MachineAssignment::class, 'operator_id');
    }

    public function technicianAssignments(): HasMany
    {
        return $this->hasMany(MachineAssignment::class, 'technician_id');
    }
}
