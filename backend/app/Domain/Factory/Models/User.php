<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Database\Factories\UserFactory;
use App\Domain\Factory\Models\Concerns\PresentsWebGuardRoles;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;

class User extends Authenticatable
{
    use HasFactory;
    use HasApiTokens;
    use HasRoles;
    use Notifiable;
    use PresentsWebGuardRoles;
    use TracksAuditorColumns;

    /**
     * أدوار Spatie مُخزَّنة بحارس web؛ Sanctum للمصادقة فقط.
     *
     * @var string
     */
    protected $guard_name = 'web';

    protected $fillable = [
        'name',
        'email',
        'password',
        'employee_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    protected static function newFactory(): Factory
    {
        return UserFactory::new();
    }
}
