<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payroll extends Model
{
    protected $fillable = [
        'year',
        'month',
        'status',
        'period_start',
        'period_end',
        'total_regular_pay',
        'total_overtime_pay',
        'total_friday_overtime_pay',
        'total_amount',
        'generated_by',
        'generated_at',
        'locked_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'total_regular_pay' => 'decimal:2',
            'total_overtime_pay' => 'decimal:2',
            'total_friday_overtime_pay' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'generated_at' => 'datetime',
            'locked_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
