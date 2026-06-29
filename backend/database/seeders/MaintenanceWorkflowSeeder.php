<?php

namespace Database\Seeders;

use App\Application\Workflow\WorkflowDesignerService;
use App\Application\Workflow\WorkflowExecutionService;
use App\Application\Workflow\WorkflowTemplateService;
use App\Domain\Factory\Enums\WorkflowCategory;
use App\Domain\Factory\Enums\WorkflowPriority;
use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmploymentStatus;
use App\Domain\Factory\Models\JobRole;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Domain\Factory\Models\Shift;
use App\Domain\Factory\Models\WorkflowInstance;
use App\Domain\Factory\Models\WorkflowTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Auth;

class MaintenanceWorkflowSeeder extends Seeder
{
    /**
     * @return array{template: WorkflowTemplate, instance: ?WorkflowInstance, ticket: ?MaintenanceTicket}
     */
    public function run(bool $startInstance = true, bool $force = false): array
    {
        $supervisor = Employee::query()->where('code', 'EMP-DEMO-SUP')->first()
            ?? Employee::query()->where('code', 'EMP-001')->firstOrFail();

        $maintTech = $this->ensureMaintenanceTechnician();

        $templates = app(WorkflowTemplateService::class);
        $designer = app(WorkflowDesignerService::class);

        $deptMaint = Department::query()->where('code', 'DEPT-MAINT')->first();

        $template = WorkflowTemplate::query()->where('code', 'MAINTENANCE_REQUEST')->first();

        if (! $template) {
            $template = $templates->create([
                'code' => 'MAINTENANCE_REQUEST',
                'name' => 'طلب صيانة',
                'description' => 'سير عمل معالجة أعطال الآلات: استلام → تشخيص → إصلاح → مراجعة',
                'category' => WorkflowCategory::Maintenance->value,
                'departmentId' => $deptMaint?->id,
                'defaultPriority' => WorkflowPriority::High->value,
            ]);
        }

        $needsGraph = $force || ! $template->published_version_id;

        if ($needsGraph) {
            $version = $template->versions()
                ->where('status', 'draft')
                ->orderByDesc('version')
                ->first();

            if (! $version) {
                $version = $templates->createDraftVersion($template);
            }

            $designer->saveGraph($version, $this->maintenanceGraph($supervisor->id, $maintTech->id));
            $templates->publishVersion($version->fresh());
            $template->refresh();
        }

        $instance = null;
        $ticket = null;

        if ($startInstance) {
            $ticket = $this->ensureMaintenanceTicket();
            $execution = app(WorkflowExecutionService::class);

            $existing = WorkflowInstance::query()
                ->where('subject_type', (new MaintenanceTicket)->getMorphClass())
                ->where('subject_id', $ticket->id)
                ->whereNotIn('status', ['completed', 'cancelled', 'rejected'])
                ->first();

            if ($existing) {
                $instance = $existing;
            } else {
                $admin = \App\Domain\Factory\Models\User::query()->where('email', config('factory.superadmin.email'))->first();
                if ($admin) {
                    Auth::login($admin);
                }

                $instance = $execution->start([
                    'templateId' => $template->id,
                    'subjectType' => 'maintenance_ticket',
                    'subjectId' => $ticket->id,
                    'priority' => WorkflowPriority::High->value,
                ]);
            }
        }

        return [
            'template' => $template->fresh(['publishedVersion.stages']),
            'instance' => $instance,
            'ticket' => $ticket,
        ];
    }

    private function ensureMaintenanceTechnician(): Employee
    {
        $active = EmploymentStatus::query()->where('code', 'ACTIVE')->first();
        $maintRole = JobRole::query()->where('code', 'ROLE-MAINT-TECH')->first();
        $maintDept = Department::query()->where('code', 'DEPT-MAINT')->first();
        $morning = Shift::query()->where('code', 'SHIFT-MORNING')->first();

        return Employee::updateOrCreate(
            ['code' => 'EMP-MAINT-01'],
            [
                'employee_number' => 'EMP-MAINT-01',
                'name' => 'سامر الحمادي',
                'first_name' => 'سامر',
                'last_name' => 'الحمادي',
                'job_title' => 'فني صيانة',
                'department' => 'الصيانة',
                'department_id' => $maintDept?->id,
                'job_role_id' => $maintRole?->id,
                'shift_id' => $morning?->id,
                'employment_status_id' => $active?->id,
                'hire_date' => '2021-04-10',
                'basic_salary' => 950,
                'is_active' => true,
            ]
        );
    }

    private function ensureMaintenanceTicket(): MaintenanceTicket
    {
        $machine = Machine::query()->where('code', 'INJ-01')->first()
            ?? Machine::query()->firstOrFail();

        return MaintenanceTicket::firstOrCreate(
            ['machine_id' => $machine->id, 'title' => 'عطل حساس الحرارة'],
            [
                'ticket_kind' => 'breakdown',
                'status' => 'open',
                'failure_date' => now()->toDateString(),
                'severity' => 'high',
                'description' => 'ارتفاع غير طبيعي في منطقة الحقن — بانتظار سير العمل',
            ]
        );
    }

    /**
     * @return array{nodes: array<int, array<string, mixed>>, edges: array<int, array<string, mixed>>}
     */
    private function maintenanceGraph(int $supervisorId, int $maintTechId): array
    {
        return [
            'nodes' => [
                [
                    'id' => 's-receive',
                    'type' => 'workflowStage',
                    'position' => ['x' => 200, 'y' => 0],
                    'data' => [
                        'name' => 'استلام الطلب',
                        'description' => 'تسجيل العطل وتحديد الأولوية',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $supervisorId],
                        'slaDurationMinutes' => 60,
                        'checklistRequired' => true,
                        'checklist' => [
                            ['label' => 'تأكيد بيانات الآلة', 'isRequired' => true],
                            ['label' => 'تحديد درجة الخطورة', 'isRequired' => true],
                        ],
                        'allowReturn' => false,
                        'allowRejection' => false,
                    ],
                ],
                [
                    'id' => 's-diagnose',
                    'type' => 'workflowStage',
                    'position' => ['x' => 200, 'y' => 140],
                    'data' => [
                        'name' => 'تشخيص العطل',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $maintTechId],
                        'slaDurationMinutes' => 240,
                        'checklistRequired' => true,
                        'checklist' => [
                            ['label' => 'فحص ميداني للآلة', 'isRequired' => true],
                            ['label' => 'تسجيل السبب الجذري', 'isRequired' => true],
                        ],
                    ],
                ],
                [
                    'id' => 'gw-repair',
                    'type' => 'workflowGateway',
                    'position' => ['x' => 228, 'y' => 280],
                    'data' => ['question' => 'إصلاح ميداني؟', 'gatewayType' => 'exclusive'],
                ],
                [
                    'id' => 's-repair',
                    'type' => 'workflowStage',
                    'position' => ['x' => 40, 'y' => 400],
                    'data' => [
                        'name' => 'تنفيذ الإصلاح',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $maintTechId],
                        'slaDurationMinutes' => 480,
                        'checklistRequired' => true,
                        'checklist' => [
                            ['label' => 'تنفيذ الإصلاح', 'isRequired' => true],
                            ['label' => 'اختبار التشغيل', 'isRequired' => true],
                        ],
                    ],
                ],
                [
                    'id' => 's-parts',
                    'type' => 'workflowStage',
                    'position' => ['x' => 360, 'y' => 400],
                    'data' => [
                        'name' => 'طلب قطع غيار',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $supervisorId],
                        'slaDurationMinutes' => 1440,
                        'checklist' => [
                            ['label' => 'تحديد القطع المطلوبة', 'isRequired' => true],
                            ['label' => 'فتح طلب توريد', 'isRequired' => true],
                        ],
                    ],
                ],
                [
                    'id' => 's-close',
                    'type' => 'workflowStage',
                    'position' => ['x' => 200, 'y' => 540],
                    'data' => [
                        'name' => 'مراجعة وإغلاق',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $supervisorId],
                        'requiresApproval' => true,
                        'slaDurationMinutes' => 120,
                        'checklist' => [
                            ['label' => 'تأكيد عودة الآلة للخدمة', 'isRequired' => true],
                        ],
                    ],
                ],
            ],
            'edges' => [
                ['id' => 'e-receive-diagnose', 'source' => 's-receive', 'target' => 's-diagnose', 'type' => 'smoothstep', 'data' => ['conditionType' => 'default', 'label' => '']],
                ['id' => 'e-diagnose-gw', 'source' => 's-diagnose', 'target' => 'gw-repair', 'type' => 'smoothstep', 'data' => ['conditionType' => 'default', 'label' => '']],
                ['id' => 'e-gw-repair-yes', 'source' => 'gw-repair', 'target' => 's-repair', 'type' => 'smoothstep', 'data' => ['conditionType' => 'on_approve', 'label' => 'نعم']],
                ['id' => 'e-gw-repair-no', 'source' => 'gw-repair', 'target' => 's-parts', 'type' => 'smoothstep', 'data' => ['conditionType' => 'on_reject', 'label' => 'لا']],
                ['id' => 'e-repair-close', 'source' => 's-repair', 'target' => 's-close', 'type' => 'smoothstep', 'data' => ['conditionType' => 'default', 'label' => '']],
                ['id' => 'e-parts-repair', 'source' => 's-parts', 'target' => 's-repair', 'type' => 'smoothstep', 'data' => ['conditionType' => 'default', 'label' => 'بعد التوريد']],
            ],
        ];
    }
}
