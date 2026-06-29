<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MachineDowntimePhoto extends Model
{
    protected $fillable = [
        'machine_downtime_id',
        'file_path',
        'file_name',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function downtime(): BelongsTo
    {
        return $this->belongsTo(MachineDowntime::class, 'machine_downtime_id');
    }
}
