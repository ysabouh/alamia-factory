<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkCenter extends Model
{
    protected $fillable = [
        'work_center_code',
        'work_center_name',
        'hall_id',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function hall(): BelongsTo
    {
        return $this->belongsTo(Hall::class);
    }
}
