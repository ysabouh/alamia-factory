<?php

namespace App\Console\Commands;

use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class EnsureDemoUsersCommand extends Command
{
    protected $signature = 'factory:ensure-demo-users';

    protected $description = 'Create or reset demo user accounts linked to demo employees';

    public function handle(): int
    {
        $accounts = [
            [
                'email' => 'yasmeen.demo@factory.local',
                'password' => 'Demo@2026',
                'name' => 'ياسمين القحطاني',
                'employee_code' => 'EMP-DEMO-SUP',
                'role' => 'supervisor',
            ],
            [
                'email' => 'khalil.demo@factory.local',
                'password' => 'Demo@2026',
                'name' => 'خليل المرعي',
                'employee_code' => 'EMP-DEMO-OPS',
                'role' => 'employee',
            ],
            [
                'email' => 'samer.demo@factory.local',
                'password' => 'Demo@2026',
                'name' => 'سامر الحمادي',
                'employee_code' => 'EMP-MAINT-01',
                'role' => 'supervisor',
            ],
        ];

        Role::findOrCreate('supervisor', 'web');
        Role::findOrCreate('employee', 'web');

        foreach ($accounts as $account) {
            $employee = Employee::query()->where('code', $account['employee_code'])->first();
            if (! $employee) {
                $this->warn("Employee {$account['employee_code']} not found — run db:seed first.");

                continue;
            }

            $user = User::query()->firstOrNew(['email' => $account['email']]);
            $user->name = $account['name'];
            $user->employee_id = $employee->id;
            $user->is_active = true;
            $user->password = $account['password'];
            $user->save();
            $user->syncRoles([$account['role']]);

            $this->info("{$account['name']}: {$account['email']} / {$account['password']} ({$account['role']})");
        }

        return self::SUCCESS;
    }
}
