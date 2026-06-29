<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;

class OrgChartLayoutSetting extends Model
{
    protected $fillable = [
        'scope',
        'settings',
        'positions',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'positions' => 'array',
        ];
    }
}
