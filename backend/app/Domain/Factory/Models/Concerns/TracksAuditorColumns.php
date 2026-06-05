<?php

namespace App\Domain\Factory\Models\Concerns;

use App\Domain\Factory\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * يملأ created_by / updated_by عند الإنشاء والتحديث.
 * التواريخ عبر أعمدة Laravel القياسية created_at / updated_at.
 */
trait TracksAuditorColumns
{
    public function initializeTracksAuditorColumns(): void
    {
        $this->mergeFillable([
            'created_by',
            'updated_by',
        ]);
    }

    protected static function bootTracksAuditorColumns(): void
    {
        static::creating(function (Model $model): void {
            $uid = Auth::id();
            if ($uid === null) {
                return;
            }
            if ($model->getAttribute('created_by') === null) {
                $model->setAttribute('created_by', $uid);
            }
            if ($model->getAttribute('updated_by') === null) {
                $model->setAttribute('updated_by', $uid);
            }
        });

        static::updating(function (Model $model): void {
            $uid = Auth::id();
            if ($uid !== null) {
                $model->setAttribute('updated_by', $uid);
            }
        });
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
