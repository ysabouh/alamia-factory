<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactoryOrgSetting extends Model
{
    protected $fillable = [
        'scope',
        'title',
        'general_manager_employee_id',
    ];

    public function generalManager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'general_manager_employee_id');
    }
}
