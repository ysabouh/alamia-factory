<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StorageLocation extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'warehouse_id',
        'code',
        'name',
    ];

    protected function casts(): array
    {
        return [];
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
