<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoldImage extends Model
{
    protected $fillable = [
        'mold_id',
        'image_url',
        'image_type',
        'is_primary',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'uploaded_at' => 'datetime',
        ];
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }
}
