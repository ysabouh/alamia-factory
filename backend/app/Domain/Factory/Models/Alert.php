<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Alert extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'alertable_type',
        'alertable_id',
        'severity',
        'message',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return array_merge(self::auditorDateCasts(), [
            'resolved_at' => 'datetime',
        ]);
    }

    public function alertable(): MorphTo
    {
        return $this->morphTo();
    }
}
