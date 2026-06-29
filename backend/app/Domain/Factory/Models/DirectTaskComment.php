<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DirectTaskComment extends Model
{
    protected $fillable = [
        'task_id',
        'user_id',
        'body',
        'comment_type',
    ];

    public function task(): BelongsTo
    {
        return $this->belongsTo(DirectTask::class, 'task_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
