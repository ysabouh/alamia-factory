<?php

namespace Database\Seeders;

use App\Domain\Factory\Enums\InspectionResultStatus;
use App\Domain\Factory\Enums\InspectionStatus;
use App\Domain\Factory\Enums\WorkOrderStatus;
use App\Domain\Factory\Enums\WorkOrderWorkerRole;
use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmploymentStatus;
use App\Domain\Factory\Models\Hall;
use App\Domain\Factory\Models\JobRole;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductionLog;
use App\Domain\Factory\Models\QualityChecklist;
use App\Domain\Factory\Models\QualityChecklistItem;
use App\Domain\Factory\Models\QualityInspection;
use App\Domain\Factory\Models\QualityInspectionResult;
use App\Domain\Factory\Models\Shift;
use App\Domain\Factory\Models\User;
use App\Domain\Factory\Models\WorkOrder;
use App\Domain\Factory\Models\WorkOrderWorker;
use Illuminate\Database\Seeder;

class ProductionDemoSeeder extends Seeder
{
    public function run(bool $force = false): void
    {
        if (! $force && WorkOrder::query()->where('order_no', 'like', 'DEMO-PO-%')->exists()) {
            $this->command?->info('بيانات DEMO موجودة مسبقاً — لم يُحذف شيء. استخدم factory:seed-demo --force لإعادة التوليد.');

            return;
        }

        $injectionType = MachineType::firstOrCreate(['code' => 'injection'], ['name' => 'حقن', 'is_active' => true]);
        $blowType = MachineType::firstOrCreate(['code' => 'blow'], ['name' => 'نفخ', 'is_active' => true]);

        $injMachine = Machine::firstOrCreate(
            ['code' => 'INJ-01'],
            [
                'machine_type_id' => $injectionType->id,
                'name' => 'حقن 350 طن',
                'brand' => 'Haitian',
                'factory_section' => 'قاعة الحقن',
                'status' => 'running',
                'is_active' => true,
            ]
        );
        $injMachine->update(['status' => 'running']);

        $blwMachine = Machine::firstOrCreate(
            ['code' => 'BLW-01'],
            [
                'machine_type_id' => $blowType->id,
                'name' => 'نفخ عبوات',
                'brand' => 'Sidel',
                'factory_section' => 'قاعة النفخ',
                'status' => 'running',
                'is_active' => true,
            ]
        );

        $morningShift = Shift::firstOrCreate(
            ['code' => 'SHIFT-MORNING'],
            ['name' => 'صباحي', 'starts_at' => '08:00', 'ends_at' => '16:00', 'is_active' => true]
        );
        $eveningShift = Shift::firstOrCreate(
            ['code' => 'SHIFT-EVENING'],
            ['name' => 'مسائي', 'starts_at' => '16:00', 'ends_at' => '00:00', 'is_active' => true]
        );
        $morningShift->update(['is_active' => true]);
        $eveningShift->update(['is_active' => true]);

        [$supervisor, $operator, $manager] = $this->ensureDemoEmployees($morningShift, $eveningShift);

        $products = $this->seedProducts();
        $molds = $this->seedMolds($products, $injMachine, $blwMachine);
        $checklists = $this->seedQualityChecklists($products);

        $adminUser = User::where('email', config('factory.superadmin.email'))->first();

        $this->seedWorkOrder([
            'order_no' => 'DEMO-PO-0001',
            'product' => $products['cap'],
            'machine' => $injMachine,
            'mold' => $molds['cap'],
            'shift' => $morningShift,
            'supervisor' => $supervisor,
            'manager' => $manager,
            'status' => WorkOrderStatus::Running,
            'planned' => 8000,
            'produced' => 3200,
            'start_time' => now()->subHours(5),
            'workers' => [
                [$operator, WorkOrderWorkerRole::Operator],
                [$supervisor, WorkOrderWorkerRole::ShiftLeader],
            ],
            'logs' => [
                [now()->subHours(4), now()->subHours(2), 1400, 18],
                [now()->subHours(2), now(), 1800, 22],
            ],
            'inspections' => [
                [
                    'is_final' => false,
                    'status' => InspectionStatus::Passed,
                    'checklist' => $checklists['cap'],
                    'results' => ['weight' => '19.4', 'leak' => 'true'],
                ],
            ],
            'notes' => 'أمر تشغيل نشط — غطاء 5 لتر HDPE',
        ], $adminUser?->id, $force);

        $this->seedWorkOrder([
            'order_no' => 'DEMO-PO-0002',
            'product' => $products['pet'],
            'machine' => $blwMachine,
            'mold' => $molds['pet'],
            'shift' => $eveningShift,
            'supervisor' => $supervisor,
            'manager' => $manager,
            'status' => WorkOrderStatus::Draft,
            'planned' => 12000,
            'produced' => 0,
            'notes' => 'مسودة — عبوة PET 1 لتر (جاهزة للبدء)',
        ], $adminUser?->id, $force);

        $this->seedWorkOrder([
            'order_no' => 'DEMO-PO-0003',
            'product' => $products['handle'],
            'machine' => $injMachine,
            'mold' => $molds['handle'],
            'shift' => $morningShift,
            'supervisor' => $supervisor,
            'manager' => $manager,
            'status' => WorkOrderStatus::Paused,
            'planned' => 6000,
            'produced' => 2100,
            'start_time' => now()->subHours(8),
            'workers' => [[$operator, WorkOrderWorkerRole::Operator]],
            'logs' => [
                [now()->subHours(6), now()->subHours(4), 1100, 35],
                [now()->subHours(4), now()->subHours(2), 1000, 28],
            ],
            'inspections' => [
                [
                    'is_final' => false,
                    'status' => InspectionStatus::Failed,
                    'checklist' => $checklists['handle'],
                    'results' => ['weight' => '24.5', 'visual' => 'false'],
                    'corrective_action' => 'ضبط ضغط الحقن وإعادة المعايرة',
                ],
            ],
            'notes' => 'متوقف — فشل فحص جودة (عنصر حرج)',
        ], $adminUser?->id, $force);

        $yesterday = now()->subDay()->toDateString();
        $this->seedWorkOrder([
            'order_no' => 'DEMO-PO-0099',
            'product' => $products['cap'],
            'machine' => $injMachine,
            'mold' => $molds['cap'],
            'shift' => $morningShift,
            'supervisor' => $supervisor,
            'manager' => $manager,
            'status' => WorkOrderStatus::Completed,
            'planned' => 5000,
            'produced' => 4980,
            'production_date' => $yesterday,
            'start_time' => now()->subDay()->setTime(8, 0),
            'end_time' => now()->subDay()->setTime(15, 30),
            'logs' => [
                [now()->subDay()->setTime(8, 0), now()->subDay()->setTime(10, 0), 1600, 10],
                [now()->subDay()->setTime(10, 0), now()->subDay()->setTime(12, 0), 1680, 8],
                [now()->subDay()->setTime(13, 0), now()->subDay()->setTime(15, 30), 1700, 12],
            ],
            'inspections' => [
                [
                    'is_final' => true,
                    'status' => InspectionStatus::Passed,
                    'checklist' => $checklists['cap'],
                    'results' => ['weight' => '19.1', 'leak' => 'true'],
                ],
            ],
            'notes' => 'مكتمل أمس — جاهز للمستودع',
        ], $adminUser?->id, $force);

        $this->command?->info('Production demo data ready: '.WorkOrder::count().' work orders.');
    }

    /**
     * @return array{0: Employee, 1: Employee, 2: Employee|null}
     */
    private function ensureDemoEmployees(Shift $morningShift, Shift $eveningShift): array
    {
        $active = EmploymentStatus::firstOrCreate(['code' => 'ACTIVE'], ['name' => 'نشيط']);
        $injHall = Hall::firstOrCreate(['code' => 'INJ-H1'], ['name' => 'قاعة الحقن 1', 'hall_type' => 'Injection']);
        $injDept = Department::firstOrCreate(['code' => 'DEPT-INJ-OPS'], ['name' => 'تشغيل الحقن', 'hall_id' => $injHall->id]);
        $prodSupRole = JobRole::firstOrCreate(['code' => 'ROLE-PROD-SUP'], ['name' => 'مشرف إنتاج', 'role_level' => 8]);
        $opRole = JobRole::firstOrCreate(['code' => 'ROLE-MACHINE-OP'], ['name' => 'مشغّل ماكينة', 'role_level' => 5]);

        $manager = Employee::firstOrCreate(
            ['code' => 'EMP-001'],
            ['name' => 'مدير النظام', 'job_title' => 'مدير إنتاج', 'is_active' => true]
        );

        $supervisor = Employee::updateOrCreate(
            ['employee_number' => 'EMP-DEMO-SUP'],
            [
                'code' => 'EMP-DEMO-SUP',
                'name' => 'ياسمين القحطاني',
                'first_name' => 'ياسمين',
                'last_name' => 'القحطاني',
                'job_title' => 'مشرفة إنتاج',
                'hall_id' => $injHall->id,
                'department_id' => $injDept->id,
                'job_role_id' => $prodSupRole->id,
                'shift_id' => $morningShift->id,
                'employment_status_id' => $active->id,
                'is_active' => true,
            ]
        );

        $operator = Employee::updateOrCreate(
            ['employee_number' => 'EMP-DEMO-OPS'],
            [
                'code' => 'EMP-DEMO-OPS',
                'name' => 'خليل المرعي',
                'first_name' => 'خليل',
                'last_name' => 'المرعي',
                'job_title' => 'مشغّل حقن',
                'hall_id' => $injHall->id,
                'department_id' => $injDept->id,
                'job_role_id' => $opRole->id,
                'shift_id' => $eveningShift->id,
                'employment_status_id' => $active->id,
                'is_active' => true,
            ]
        );

        return [$supervisor, $operator, $manager];
    }

    /**
     * @return array{cap: Product, pet: Product, handle: Product}
     */
    private function seedProducts(): array
    {
        $cap = Product::firstOrCreate(
            ['code' => 'P-5L-CAP'],
            [
                'product_code' => 'P-5L-CAP',
                'sku' => 'P-5L-CAP',
                'name' => 'غطاء 5 لتر',
                'product_name_ar' => 'غطاء 5 لتر HDPE',
                'product_name_en' => '5L HDPE Cap',
                'unit' => 'piece',
                'standard_weight_grams' => 40,
                'product_type' => 'finished_good',
                'manufacturing_type' => 'injection',
                'product_status' => 'active',
                'is_active' => true,
            ]
        );

        $pet = Product::firstOrCreate(
            ['code' => 'P-BTL-1L'],
            [
                'product_code' => 'P-BTL-1L',
                'sku' => 'P-BTL-1L',
                'name' => 'عبوة 1 لتر',
                'product_name_ar' => 'عبوة 1 لتر PET',
                'product_name_en' => '1L PET Bottle',
                'unit' => 'piece',
                'standard_weight_grams' => 28,
                'product_type' => 'finished_good',
                'manufacturing_type' => 'pet_blow',
                'product_status' => 'active',
                'is_active' => true,
            ]
        );

        $handle = Product::firstOrCreate(
            ['code' => 'P-HANDLE-PP'],
            [
                'product_code' => 'P-HANDLE-PP',
                'sku' => 'P-HANDLE-PP',
                'name' => 'يد بلاستيك',
                'product_name_ar' => 'يد بلاستيك PP',
                'product_name_en' => 'PP Handle',
                'unit' => 'piece',
                'standard_weight_grams' => 12,
                'product_type' => 'finished_good',
                'manufacturing_type' => 'injection',
                'product_status' => 'active',
                'is_active' => true,
            ]
        );

        return compact('cap', 'pet', 'handle');
    }

    /**
     * @param  array{cap: Product, pet: Product, handle: Product}  $products
     * @return array{cap: Mold, pet: Mold, handle: Mold}
     */
    private function seedMolds(array $products, Machine $inj, Machine $blw): array
    {
        $cap = Mold::firstOrCreate(
            ['code' => 'MOLD-CAP-5L'],
            [
                'product_id' => $products['cap']->id,
                'name' => 'قالب غطاء 5 لتر',
                'mold_type' => 'injection',
                'status' => 'active',
                'cavity_count' => 4,
                'product_name' => 'غطاء 5 لتر',
                'machine_id' => $inj->id,
            ]
        );

        $pet = Mold::firstOrCreate(
            ['code' => 'MOLD-BTL-1L'],
            [
                'product_id' => $products['pet']->id,
                'name' => 'قالب عبوة 1 لتر',
                'mold_type' => 'pet_blow',
                'status' => 'active',
                'cavity_count' => 6,
                'product_name' => 'عبوة 1 لتر PET',
                'machine_id' => $blw->id,
            ]
        );

        $handle = Mold::firstOrCreate(
            ['code' => 'MOLD-HANDLE-PP'],
            [
                'product_id' => $products['handle']->id,
                'name' => 'قالب يد PP',
                'mold_type' => 'injection',
                'status' => 'active',
                'cavity_count' => 8,
                'product_name' => 'يد بلاستيك PP',
                'machine_id' => $inj->id,
            ]
        );

        return compact('cap', 'pet', 'handle');
    }

    /**
     * @param  array{cap: Product, pet: Product, handle: Product}  $products
     * @return array{cap: QualityChecklist, handle: QualityChecklist}
     */
    private function seedQualityChecklists(array $products): array
    {
        $capChecklist = QualityChecklist::firstOrCreate(
            ['product_id' => $products['cap']->id, 'name' => 'فحص غطاء 5 لتر'],
            ['description' => 'فحص وزن وتسريب', 'is_active' => true]
        );

        $capItems = [
            ['item_name' => 'الوزن', 'item_type' => 'numeric', 'min_value' => 18, 'max_value' => 20, 'unit' => 'gram', 'sort_order' => 10, 'is_critical' => true],
            ['item_name' => 'اختبار التسريب', 'item_type' => 'boolean', 'sort_order' => 20, 'is_critical' => true],
        ];
        foreach ($capItems as $row) {
            QualityChecklistItem::firstOrCreate(
                ['checklist_id' => $capChecklist->id, 'item_name' => $row['item_name']],
                $row
            );
        }

        $handleChecklist = QualityChecklist::firstOrCreate(
            ['product_id' => $products['handle']->id, 'name' => 'فحص يد PP'],
            ['description' => 'فحص وزن ومظهر', 'is_active' => true]
        );

        $handleItems = [
            ['item_name' => 'الوزن', 'item_type' => 'numeric', 'min_value' => 10, 'max_value' => 14, 'unit' => 'gram', 'sort_order' => 10, 'is_critical' => true],
            ['item_name' => 'المظهر البصري', 'item_type' => 'boolean', 'sort_order' => 20, 'is_critical' => false],
        ];
        foreach ($handleItems as $row) {
            QualityChecklistItem::firstOrCreate(
                ['checklist_id' => $handleChecklist->id, 'item_name' => $row['item_name']],
                $row
            );
        }

        QualityChecklist::firstOrCreate(
            ['product_id' => $products['pet']->id, 'name' => 'فحص عبوة PET'],
            ['description' => 'فحص سماكة وجدار', 'is_active' => true]
        );

        return ['cap' => $capChecklist->fresh('items'), 'handle' => $handleChecklist->fresh('items')];
    }

    /**
     * @param  array<string, mixed>  $spec
     */
    private function seedWorkOrder(array $spec, ?int $createdBy, bool $force = false): void
    {
        /** @var Product $product */
        $product = $spec['product'];
        /** @var Machine $machine */
        $machine = $spec['machine'];
        /** @var Mold $mold */
        $mold = $spec['mold'];
        /** @var Shift $shift */
        $shift = $spec['shift'];
        /** @var Employee $supervisor */
        $supervisor = $spec['supervisor'];

        $existing = WorkOrder::query()->where('order_no', $spec['order_no'])->first();

        $order = WorkOrder::updateOrCreate(
            ['order_no' => $spec['order_no']],
            [
                'product_id' => $product->id,
                'code' => $spec['order_no'],
                'production_date' => $spec['production_date'] ?? now()->toDateString(),
                'machine_id' => $machine->id,
                'mold_id' => $mold->id,
                'shift_id' => $shift->id,
                'supervisor_id' => $supervisor->id,
                'production_manager_id' => $spec['manager']?->id,
                'target_quantity' => $spec['planned'],
                'planned_quantity' => $spec['planned'],
                'priority' => 'normal',
                'status' => $spec['status'],
                'start_time' => $spec['start_time'] ?? null,
                'end_time' => $spec['end_time'] ?? null,
                'notes' => $spec['notes'] ?? null,
            ]
        );

        if ($existing !== null && ! $force) {
            return;
        }

        WorkOrderWorker::query()->where('work_order_id', $order->id)->forceDelete();
        foreach ($spec['workers'] ?? [] as [$employee, $role]) {
            WorkOrderWorker::query()->create([
                'work_order_id' => $order->id,
                'employee_id' => $employee->id,
                'role' => $role,
                'effective_from' => $spec['start_time'] ?? now(),
            ]);
        }

        ProductionLog::query()->where('work_order_id', $order->id)->delete();
        foreach ($spec['logs'] ?? [] as [$from, $to, $good, $scrap]) {
            ProductionLog::query()->create([
                'work_order_id' => $order->id,
                'from_time' => $from,
                'to_time' => $to,
                'good_quantity' => $good,
                'scrap_quantity' => $scrap,
                'created_by' => $createdBy,
            ]);
        }

        if (! empty($spec['inspections'])) {
            foreach ($spec['inspections'] as $inspSpec) {
                $this->seedInspection($order, $supervisor, $inspSpec);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $spec
     */
    private function seedInspection(WorkOrder $order, Employee $inspector, array $spec): void
    {
        /** @var QualityChecklist $checklist */
        $checklist = $spec['checklist'];
        $checklist->loadMissing('items');

        $exists = QualityInspection::query()
            ->where('work_order_id', $order->id)
            ->where('is_final', (bool) ($spec['is_final'] ?? false))
            ->where('status', ($spec['status'] ?? InspectionStatus::Passed)->value)
            ->exists();

        if ($exists) {
            return;
        }

        $status = $spec['status'] ?? InspectionStatus::Passed;
        $legacyResult = match ($status) {
            InspectionStatus::Failed => 'fail',
            InspectionStatus::Warning => 'warning',
            default => 'pass',
        };

        $inspection = QualityInspection::query()->create([
            'work_order_id' => $order->id,
            'quality_employee_id' => $inspector->id,
            'inspection_time' => now()->subHours(1),
            'status' => $status,
            'result' => $legacyResult,
            'sample_size' => 5,
            'is_final' => (bool) ($spec['is_final'] ?? false),
            'corrective_action' => $spec['corrective_action'] ?? null,
            'notes' => 'فحص تجريبي من البذرة',
        ]);

        $results = $spec['results'] ?? [];
        foreach ($checklist->items as $item) {
            $key = match ($item->item_name) {
                'الوزن' => 'weight',
                'اختبار التسريب' => 'leak',
                'المظهر البصري' => 'visual',
                default => null,
            };
            if ($key === null || ! array_key_exists($key, $results)) {
                continue;
            }
            $value = $results[$key];
            $status = InspectionResultStatus::Pass;
            if ($item->item_type?->value === 'boolean') {
                $status = $value === 'true' || $value === true ? InspectionResultStatus::Pass : InspectionResultStatus::Fail;
            } elseif ($item->item_type?->value === 'numeric' && is_numeric($value)) {
                $num = (float) $value;
                if ($item->min_value !== null && $num < $item->min_value) {
                    $status = InspectionResultStatus::Fail;
                } elseif ($item->max_value !== null && $num > $item->max_value) {
                    $status = InspectionResultStatus::Fail;
                }
            }

            QualityInspectionResult::query()->create([
                'quality_inspection_id' => $inspection->id,
                'checklist_item_id' => $item->id,
                'measured_value' => (string) $value,
                'result_status' => $status,
            ]);
        }
    }
}
