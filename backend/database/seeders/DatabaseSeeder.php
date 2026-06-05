<?php

namespace Database\Seeders;

use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmploymentStatus;
use App\Domain\Factory\Models\Hall;
use App\Domain\Factory\Models\JobRole;
use App\Domain\Factory\Models\BlowMachineSpec;
use App\Domain\Factory\Models\InjectionMachineSpec;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineCounter;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\Shift;
use App\Domain\Factory\Models\User;
use App\Domain\Factory\Models\Warehouse;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
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

        $admin = Role::findOrCreate('admin', $guard);
        $admin->syncPermissions(Permission::query()->where('guard_name', $guard)->get());

        Role::findOrCreate('supervisor', $guard)->givePermissionTo([
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
            'production.reports',
            'quality.inspect',
            'maintenance.open_ticket',
            'inventory.view',
            'workforce.view',
            'attendance.view',
            'attendance.record',
            'attendance.approve',
            'overtime.approve',
        ]);

        Role::findOrCreate('hr_manager', $guard)->givePermissionTo([
            'workforce.view',
            'workforce.manage_employees',
            'workforce.manage_masters',
            'attendance.view',
            'attendance.record',
            'attendance.manage',
            'attendance.approve',
            'overtime.request',
            'overtime.approve',
            'payroll.view',
            'payroll.generate',
            'shifts.assign',
        ]);

        Role::findOrCreate('employee', $guard)->givePermissionTo([
            'attendance.view',
            'attendance.record',
            'overtime.request',
        ]);

        $this->seedWorkforceReferenceGraph();

        $this->call(AttendancePayrollSeeder::class);

        $employee = Employee::firstOrCreate(
            ['code' => 'EMP-001'],
            ['name' => 'مدير النظام', 'job_title' => 'مسؤول النظام', 'department' => 'تقنية المعلومات']
        );

        $super = config('factory.superadmin');

        /** كلمة المرور نصّية: نموذج User يطبّق cast «hashed» فيُخزَّن bcrypt تلقائياً. */
        $user = User::updateOrCreate(
            ['email' => $super['email']],
            [
                'employee_id' => $employee->id,
                'name' => $super['name'],
                'password' => $super['password'],
                'is_active' => true,
            ]
        );
        $user->syncRoles([$super['role']]);

        $injection = MachineType::firstOrCreate(['code' => 'injection'], ['name' => 'حقن', 'is_active' => true]);
        $blow = MachineType::firstOrCreate(['code' => 'blow'], ['name' => 'نفخ', 'is_active' => true]);

        $product = Product::firstOrCreate(
            ['code' => 'P-5L-CAP'],
            [
                'product_code' => 'P-5L-CAP',
                'sku' => 'P-5L-CAP',
                'name' => 'غطاء 5 لتر',
                'product_name_ar' => 'غطاء 5 لتر',
                'product_name_en' => '5L Cap',
                'unit' => 'piece',
                'standard_weight_grams' => 40,
                'product_type' => 'finished_good',
                'manufacturing_type' => 'injection',
                'product_status' => 'active',
                'is_active' => true,
            ]
        );

        Mold::firstOrCreate(
            ['code' => 'MOLD-CAP-5L'],
            [
                'product_id' => $product->id,
                'name' => 'قالب غطاء 5 لتر',
                'mold_type' => 'injection',
                'status' => 'active',
                'cavity_count' => 4,
                'product_name' => 'غطاء 5 لتر',
            ]
        );

        $inj = Machine::firstOrCreate(
            ['code' => 'INJ-01'],
            [
                'machine_type_id' => $injection->id,
                'name' => 'حقن 350 طن',
                'brand' => 'Haitian',
                'model' => 'MA3500',
                'factory_section' => 'قاعة الحقن',
                'status' => 'stopped',
                'is_active' => true,
            ]
        );
        InjectionMachineSpec::firstOrCreate(
            ['machine_id' => $inj->id],
            ['clamping_force_ton' => 350, 'shot_weight_gram' => 450, 'heating_zones_count' => 5]
        );

        $blw = Machine::firstOrCreate(
            ['code' => 'BLW-01'],
            [
                'machine_type_id' => $blow->id,
                'name' => 'نفخ عبوات',
                'brand' => 'Sidel',
                'factory_section' => 'قاعة النفخ',
                'status' => 'running',
                'is_active' => true,
            ]
        );
        BlowMachineSpec::firstOrCreate(
            ['machine_id' => $blw->id],
            ['bottle_volume_max_ml' => 2000, 'cavities_count' => 6, 'production_capacity_bph' => 1200]
        );

        MachineCounter::firstOrCreate(
            ['machine_id' => $inj->id, 'counter_date' => now()->toDateString()],
            ['produced_units' => 4200, 'rejected_units' => 85, 'running_hours' => 9.5]
        );

        MaintenanceTicket::firstOrCreate(
            ['machine_id' => $inj->id, 'title' => 'عطل حساس الحرارة'],
            [
                'ticket_kind' => 'breakdown',
                'status' => 'open',
                'failure_date' => now()->toDateString(),
                'severity' => 'high',
                'description' => 'ارتفاع غير طبيعي في منطقة الحقن',
            ]
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

        $this->call(CurrencySeeder::class);
        $this->call(QualityDefectSeeder::class);

        // بيانات الإنتاج التجريبية — لا تُشغَّل تلقائياً حتى لا تُستبدل معطياتك.
        // للتوليد الآمن: php artisan factory:seed-demo
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
            ['متأخر', 'LATE'],
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
