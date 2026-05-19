<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollItem extends Model
{
    protected $fillable = [
        'payroll_id',
        'employee_id',
        'days_present',
        'days_absent',
        'total_worked_minutes',
        'total_overtime_minutes',
        'total_friday_overtime_minutes',
        'regular_pay',
        'overtime_pay',
        'friday_overtime_pay',
        'total_pay',
        'snapshot_json',
    ];

    protected function casts(): array
    {
        return [
            'regular_pay' => 'decimal:2',
            'overtime_pay' => 'decimal:2',
            'friday_overtime_pay' => 'decimal:2',
            'total_pay' => 'decimal:2',
            'snapshot_json' => 'array',
        ];
    }

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
