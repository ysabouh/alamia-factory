<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents Active / On Leave / Suspended / Terminated (PROJECT_ARCHITECTURE.md).
 */
class EmploymentStatus extends Model
{
    protected $table = 'employment_statuses';

    protected $fillable = [
        'name',
        'code',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'employment_status_id');
    }
}
