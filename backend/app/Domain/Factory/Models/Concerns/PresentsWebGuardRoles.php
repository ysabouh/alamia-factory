<?php

namespace App\Domain\Factory\Models\Concerns;

use Spatie\Permission\Models\Permission;

trait PresentsWebGuardRoles
{
    public const PERMISSION_GUARD = 'web';

    /**
     * @return list<string>
     */
    public function roleNamesForApi(): array
    {
        if ($this->relationLoaded('roles')) {
            return $this->roles
                ->where('guard_name', self::PERMISSION_GUARD)
                ->pluck('name')
                ->values()
                ->all();
        }

        return $this->roles()
            ->where('guard_name', self::PERMISSION_GUARD)
            ->pluck('name')
            ->all();
    }

    /**
     * @return list<string>
     */
    public function permissionNamesForApi(): array
    {
        if ($this->hasRole('admin', self::PERMISSION_GUARD)) {
            return Permission::query()
                ->where('guard_name', self::PERMISSION_GUARD)
                ->orderBy('name')
                ->pluck('name')
                ->all();
        }

        if (! $this->relationLoaded('roles')) {
            $this->load([
                'roles' => fn ($q) => $q->where('guard_name', self::PERMISSION_GUARD),
                'roles.permissions' => fn ($q) => $q->where('guard_name', self::PERMISSION_GUARD),
            ]);
        }

        return $this->roles
            ->where('guard_name', self::PERMISSION_GUARD)
            ->flatMap(fn ($role) => $role->permissions->where('guard_name', self::PERMISSION_GUARD))
            ->pluck('name')
            ->unique()
            ->values()
            ->all();
    }
}
