<?php

namespace App\Console\Commands;

use App\Domain\Factory\Models\Employee;
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
            'machines.manage',
            'machines.update_status',
            'machines.record_counters',
            'machines.manage_maintenance',
            'molds.view',
            'molds.manage',
            'molds.manage_maintenance',
            'products.view',
            'products.manage',
            'assembly.view',
            'assembly.manage',
            'production.record',
            'production.manage',
            'production.execute',
            'production.approve',
            'production.reports',
            'quality.inspect',
            'quality.manage_checklists',
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

        Role::findOrCreate('supervisor', $guard)->givePermissionTo([
            'production.manage',
            'production.execute',
            'quality.inspect',
            'quality.manage_checklists',
        ]);

        $employee = Employee::query()->firstOrCreate(
            ['code' => 'EMP-001'],
            ['name' => $name, 'job_title' => 'مسؤول النظام', 'department' => 'تقنية المعلومات', 'is_active' => true]
        );

        $user = User::query()->firstOrNew(['email' => $email]);
        $user->name = $name;
        $user->employee_id = $employee->id;
        $user->is_active = true;
        // cast «hashed» على User — يُخزّن bcrypt من النص الصريح في كل تشغيل
        $user->password = $password;
        $user->save();

        $user->syncRoles([$roleName]);

        $this->info('Super-admin ready.');
        $this->line("  Email:    {$email}");
        $this->line("  Password: {$password}");
        $this->line('  Role:     '.$roleName.' (all permissions)');

        return self::SUCCESS;
    }
}
