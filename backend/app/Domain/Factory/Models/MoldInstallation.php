<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoldInstallation extends Model
{
    protected $fillable = [
        'mold_id',
        'machine_id',
        'installed_at',
        'removed_at',
        'installed_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'installed_at' => 'datetime',
            'removed_at' => 'datetime',
        ];
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installed_by');
    }
}
