<?php

namespace App\Domain\Factory\Models\Concerns;

use App\Domain\Factory\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToFactoryUser
{
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}
