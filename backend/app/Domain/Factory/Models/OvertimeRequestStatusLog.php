<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OvertimeRequestStatusLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'overtime_request_id',
        'action',
        'from_status',
        'to_status',
        'actor_id',
        'assignment_reason',
        'rejection_reason',
        'note',
        'changes',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function overtimeRequest(): BelongsTo
    {
        return $this->belongsTo(OvertimeRequest::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
