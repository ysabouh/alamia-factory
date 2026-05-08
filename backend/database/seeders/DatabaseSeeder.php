<?php

namespace Database\Seeders;

use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\Shift;
use App\Domain\Factory\Models\User;
use App\Domain\Factory\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
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
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        $admin = Role::findOrCreate('admin');
        $admin->givePermissionTo($permissions);

        Role::findOrCreate('supervisor')->givePermissionTo([
            'machines.view',
            'machines.update_status',
            'production.record',
            'production.reports',
            'maintenance.open_ticket',
            'inventory.view',
        ]);

        $employee = Employee::firstOrCreate(
            ['code' => 'EMP-001'],
            ['name' => 'مدير النظام', 'job_title' => 'Admin', 'department' => 'IT']
        );

        $user = User::firstOrCreate(
            ['email' => 'admin@myfactory.local'],
            [
                'employee_id' => $employee->id,
                'name' => 'مدير النظام',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );
        $user->assignRole('admin');

        $injection = MachineType::firstOrCreate(['code' => 'injection'], ['name' => 'حقن']);
        $blow = MachineType::firstOrCreate(['code' => 'blow_molding'], ['name' => 'نفخ']);

        $product = Product::firstOrCreate(
            ['code' => 'P-5L-CAP'],
            ['name' => 'غطاء 5 لتر', 'unit' => 'piece', 'standard_weight_grams' => 40]
        );

        Mold::firstOrCreate(
            ['code' => 'MOLD-CAP-5L'],
            ['product_id' => $product->id, 'name' => 'قالب غطاء 5 لتر', 'cavity_count' => 4]
        );

        Machine::firstOrCreate(
            ['code' => 'INJ-01'],
            ['machine_type_id' => $injection->id, 'name' => 'حقن 350 طن', 'capacity' => '350 ton', 'status' => 'idle']
        );

        Machine::firstOrCreate(
            ['code' => 'BLW-01'],
            ['machine_type_id' => $blow->id, 'name' => 'نفخ عبوات', 'capacity' => '2L', 'status' => 'idle']
        );

        Shift::firstOrCreate(['name' => 'صباحي'], ['starts_at' => '08:00', 'ends_at' => '16:00']);
        Shift::firstOrCreate(['name' => 'مسائي'], ['starts_at' => '16:00', 'ends_at' => '00:00']);

        Warehouse::firstOrCreate(['code' => 'MAIN'], ['name' => 'المستودع الرئيسي', 'type' => 'general']);
    }
}
