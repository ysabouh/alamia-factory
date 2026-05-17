<?php

namespace App\Domain\Factory\Models\Concerns;

use App\Domain\Factory\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * يملأ created_by / updated_by و created_date / updated_date عند الإنشاء والتحديث
 * (عند وجود مستخدم مصادَق عليه؛ التواريخ تُملأ دائماً ما لم تُمرَّر صراحة).
 */
trait TracksAuditorColumns
{
    public function initializeTracksAuditorColumns(): void
    {
        $this->mergeFillable([
            'created_by',
            'updated_by',
            'created_date',
            'updated_date',
        ]);
    }

    protected static function bootTracksAuditorColumns(): void
    {
        static::creating(function (Model $model): void {
            $now = now();
            if ($model->getAttribute('created_date') === null) {
                $model->setAttribute('created_date', $now);
            }
            if ($model->getAttribute('updated_date') === null) {
                $model->setAttribute('updated_date', $now);
            }
            $uid = Auth::id();
            if ($uid !== null) {
                if ($model->getAttribute('created_by') === null) {
                    $model->setAttribute('created_by', $uid);
                }
                if ($model->getAttribute('updated_by') === null) {
                    $model->setAttribute('updated_by', $uid);
                }
            }
        });

        static::updating(function (Model $model): void {
            $model->setAttribute('updated_date', now());
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

    /**
     * @return array<string, string>
     */
    protected static function auditorDateCasts(): array
    {
        return [
            'created_date' => 'datetime',
            'updated_date' => 'datetime',
        ];
    }
}
