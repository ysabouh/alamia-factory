<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents Active / On Leave / Suspended / Terminated (PROJECT_ARCHITECTURE.md).
 */
class EmploymentStatus extends Model
{
    use TracksAuditorColumns;

    protected $table = 'employment_statuses';

    protected $fillable = [
        'name',
        'code',
    ];

    protected function casts(): array
    {
        return [];
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'employment_status_id');
    }
}
