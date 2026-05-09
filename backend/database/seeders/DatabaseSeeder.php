<?php

namespace Database\Seeders;

use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmploymentStatus;
use App\Domain\Factory\Models\Hall;
use App\Domain\Factory\Models\JobRole;
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
            'workforce.view',
            'workforce.manage_placement',
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
            'workforce.view',
        ]);

        $this->seedWorkforceReferenceGraph();

        $employee = Employee::firstOrCreate(
            ['code' => 'EMP-001'],
            ['name' => 'مدير النظام', 'job_title' => 'مسؤول النظام', 'department' => 'تقنية المعلومات']
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

        Shift::whereNull('code')->delete();

        Shift::firstOrCreate(
            ['code' => 'SHIFT-MORNING'],
            ['name' => 'صباحي', 'starts_at' => '08:00', 'ends_at' => '16:00']
        );

        Shift::firstOrCreate(
            ['code' => 'SHIFT-EVENING'],
            ['name' => 'مسائي', 'starts_at' => '16:00', 'ends_at' => '00:00']
        );

        Shift::firstOrCreate(
            ['code' => 'SHIFT-NIGHT'],
            ['name' => 'ليلي', 'starts_at' => '00:00', 'ends_at' => '08:00']
        );

        Warehouse::firstOrCreate(['code' => 'MAIN'], ['name' => 'المستودع الرئيسي', 'type' => 'general']);

        $this->bootstrapWorkforcePeople($employee);
    }

    /**
     * Halls → departments → job roles → employment statuses (PROJECT_ARCHITECTURE.md phase 1).
     */
    private function seedWorkforceReferenceGraph(): void
    {
        foreach ([
            ['name' => 'قاعة الحقن 1', 'code' => 'INJ-H1', 'hall_type' => 'Injection'],
            ['name' => 'قاعة الحقن 2', 'code' => 'INJ-H2', 'hall_type' => 'Injection'],
            ['name' => 'قاعة النفخ', 'code' => 'BLOW-H1', 'hall_type' => 'Blow Molding'],
            ['name' => 'التغليف والتعبئة', 'code' => 'PACK-H1', 'hall_type' => 'Packaging'],
            ['name' => 'قاعة الصيانة', 'code' => 'MAIN-H1', 'hall_type' => 'Maintenance'],
        ] as $hall) {
            Hall::firstOrCreate(['code' => $hall['code']], $hall);
        }

        $pairs = [
            ['INJ-H1', 'تشغيل الحقن 1', 'DEPT-INJ-OPS'],
            ['INJ-H2', 'تشغيل الحقن 2', 'DEPT-INJ2-OPS'],
            ['BLOW-H1', 'تشغيل النفخ', 'DEPT-BLOW-OPS'],
            ['PACK-H1', 'خط التغليف', 'DEPT-PACK'],
            ['MAIN-H1', 'إدارة الصيانة العامة', 'DEPT-MAINT'],
            ['MAIN-H1', 'كهرباء', 'DEPT-ELEC'],
            ['MAIN-H1', 'ميكانيك', 'DEPT-MECH'],
            ['PACK-H1', 'المستودع', 'DEPT-WH'],
            ['MAIN-H1', 'موارد بشرية', 'DEPT-HR'],
        ];

        foreach ($pairs as [$hallCode, $deptName, $deptCode]) {
            /** @var Hall|null $hall */
            $hall = Hall::where('code', '=', $hallCode)->first();
            Department::firstOrCreate(
                ['code' => $deptCode],
                [
                    'hall_id' => $hall?->id,
                    'name' => $deptName,
                ]
            );
        }

        $roles = [
            ['مسير المصنع', 'ROLE-FACTORY-MANAGER', 10],
            ['مشرف إنتاج', 'ROLE-PROD-SUP', 8],
            ['مشغّل ماكينة', 'ROLE-MACHINE-OP', 5],
            ['فني صيانة', 'ROLE-MAINT-TECH', 5],
            ['أمين مستودع', 'ROLE-WH', 4],
            ['مراجع جودة', 'ROLE-QA', 5],
            ['مسؤول موارد بشرية', 'ROLE-HR', 6],
            ['محاسب تكاليف', 'ROLE-ACC', 6],
        ];

        foreach ($roles as [$name, $code, $level]) {
            JobRole::firstOrCreate(['code' => $code], ['name' => $name, 'role_level' => $level]);
        }

        foreach ([
            ['نشيط', 'ACTIVE'],
            ['إجازة', 'ON_LEAVE'],
            ['موقوف مؤقتًا', 'SUSPENDED'],
            ['موقوف نهائيًا', 'TERMINATED'],
        ] as [$name, $code]) {
            EmploymentStatus::firstOrCreate(['code' => $code], ['name' => $name]);
        }
    }

    private function bootstrapWorkforcePeople(Employee $adminEmp): void
    {
        $active = EmploymentStatus::where('code', '=', 'ACTIVE')->firstOrFail();
        $morning = Shift::where('code', '=', 'SHIFT-MORNING')->firstOrFail();

        /** @var Department|null $hrDept */
        $hrDept = Department::where('code', '=', 'DEPT-HR')->first();
        /** @var Hall|null $centralHall */
        $centralHall = Hall::where('code', '=', 'MAIN-H1')->first();
        $hrRole = JobRole::where('code', '=', 'ROLE-HR')->firstOrFail();

        $adminEmp->update([
            'employee_number' => 'EMP-001',
            'first_name' => 'مدير',
            'last_name' => 'النظام',
            'department_id' => $hrDept?->id,
            'hall_id' => $centralHall?->id,
            'job_role_id' => $hrRole->id,
            'shift_id' => $morning->id,
            'employment_status_id' => $active->id,
            'hire_date' => '2020-03-01',
            'basic_salary' => 1850,
            'overtime_hour_rate' => 7.25,
            'performance_score' => 94,
            'reliability_score' => 96,
            'safety_score' => 93,
            'annual_leave_balance' => 21,
            'gender' => 'ذكر',
        ]);

        $injHall = Hall::where('code', '=', 'INJ-H1')->first();
        $injDept = Department::where('code', '=', 'DEPT-INJ-OPS')->first();
        $prodSup = JobRole::where('code', '=', 'ROLE-PROD-SUP')->firstOrFail();
        $opRole = JobRole::where('code', '=', 'ROLE-MACHINE-OP')->firstOrFail();
        $eveningShift = Shift::where('code', '=', 'SHIFT-EVENING')->firstOrFail();

        Employee::updateOrCreate(
            ['employee_number' => 'EMP-DEMO-SUP'],
            [
            'code' => 'EMP-DEMO-SUP',
            'name' => 'ياسمين القحطاني',
            'first_name' => 'ياسمين',
            'last_name' => 'القحطاني',
            'job_title' => 'مشرفة إنتاج',
            'department' => 'الإنتاج',
            'phone' => '+963944090001',
            'hire_date' => '2023-06-01',
            'hall_id' => $injHall?->id,
            'department_id' => $injDept?->id,
            'job_role_id' => $prodSup->id,
            'shift_id' => $morning->id,
            'employment_status_id' => $active->id,
            'basic_salary' => 1280,
            'overtime_hour_rate' => 5.75,
            'performance_score' => 91,
            'reliability_score' => 89,
            'safety_score' => 90,
            'annual_leave_balance' => 16,
            'gender' => 'أنثى',
            'email' => 'yasmeen.demo@factory.local',
            'is_active' => true,
            ]);

        Employee::updateOrCreate(
            ['employee_number' => 'EMP-DEMO-OPS'],
            [
            'code' => 'EMP-DEMO-OPS',
            'name' => 'خليل المرعي',
            'first_name' => 'خليل',
            'last_name' => 'المرعي',
            'job_title' => 'مشغّل حقن',
            'department' => 'الإنتاج',
            'phone' => '+963944090002',
            'hire_date' => '2022-11-20',
            'hall_id' => $injHall?->id,
            'department_id' => $injDept?->id,
            'job_role_id' => $opRole->id,
            'shift_id' => $eveningShift->id,
            'employment_status_id' => $active->id,
            'basic_salary' => 820,
            'overtime_hour_rate' => 3.5,
            'performance_score' => 88,
            'reliability_score' => 87,
            'safety_score' => 92,
            'annual_leave_balance' => 12,
            'gender' => 'ذكر',
            'email' => 'khalil.demo@factory.local',
            'is_active' => true,
            ]);
    }
}
