<?php

namespace App\Console\Commands;

use App\Domain\Factory\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class EnsureSuperAdminCommand extends Command
{
    protected $signature = 'factory:ensure-superadmin';

    protected $description = 'Create or reset the fixed super-admin account with all permissions';

    public function handle(): int
    {
        $cfg = config('factory.superadmin');
        $email = (string) $cfg['email'];
        $password = (string) $cfg['password'];
        $name = (string) $cfg['name'];
        $roleName = (string) $cfg['role'];

        $permissions = [
            'machines.view',
            'machines.update_status',
            'production.record',
            'production.approve',
            'production.reports',
            'maintenance.open_ticket',
            'maintenance.close_ticket',
            'inventory.view',
            'inventory.adjust',
            'inventory.issue_material',
            'orders.create',
            'orders.update_status',
            'analytics.view',
            'users.manage',
            'workforce.view',
            'workforce.manage_placement',
            'workforce.manage_employees',
            'workforce.manage_masters',
            'attendance.view',
            'attendance.record',
            'attendance.manage',
            'attendance.approve',
            'overtime.request',
            'overtime.approve',
            'overtime.delete',
            'payroll.view',
            'payroll.generate',
            'shifts.assign',
        ];

        $guard = 'web';

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, $guard);
        }

        $role = Role::findOrCreate($roleName, $guard);
        $role->syncPermissions(Permission::query()->where('guard_name', $guard)->get());

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password,
                'is_active' => true,
            ]
        );

        $user->syncRoles([$roleName]);

        $this->info('Super-admin ready.');
        $this->line("  Email:    {$email}");
        $this->line("  Password: {$password}");
        $this->line('  Role:     '.$roleName.' (all permissions)');

        return self::SUCCESS;
    }
}
