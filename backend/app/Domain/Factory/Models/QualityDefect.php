<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QualityDefect extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function inspectionLinks(): HasMany
    {
        return $this->hasMany(QualityInspectionDefect::class, 'defect_id');
    }
}
