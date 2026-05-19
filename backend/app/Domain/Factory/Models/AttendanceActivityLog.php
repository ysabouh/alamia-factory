<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceActivityLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'subject_type',
        'subject_id',
        'actor_id',
        'action',
        'payload',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public static function log(string $subjectType, int $subjectId, string $action, ?array $payload = null): self
    {
        return self::query()->create([
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'actor_id' => auth()->id(),
            'action' => $action,
            'payload' => $payload,
            'created_at' => now(),
        ]);
    }
}
