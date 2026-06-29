<?php

namespace Tests\Feature\Workflow;

use App\Application\Workflow\WorkflowDesignerService;
use App\Application\Workflow\WorkflowExecutionService;
use App\Application\Workflow\WorkflowSlaService;
use App\Application\Workflow\WorkflowTemplateService;
use App\Domain\Factory\Enums\WorkflowTaskStatus;
use App\Domain\Factory\Models\Alert;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\PurchaseRequest;
use App\Domain\Factory\Models\User;
use App\Domain\Factory\Models\WorkflowTask;
use App\Domain\Factory\Models\WorkflowTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class WorkflowEngineTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        $user = User::factory()->create();
        $perms = [
            'workflow.templates.manage',
            'workflow.instances.manage',
            'workflow.instances.view_all',
            'workflow.tasks.view_own',
            'workflow.tasks.execute',
            'workflow.dashboard.view',
        ];
        foreach ($perms as $p) {
            Permission::findOrCreate($p, 'web');
        }
        $user->givePermissionTo($perms);

        return $user;
    }

    private function employeeUser(): User
    {
        $employee = Employee::create([
            'code' => 'EMP-WF-1',
            'name' => 'موظف سير عمل',
            'is_active' => true,
        ]);
        $user = User::factory()->create(['employee_id' => $employee->id]);
        Permission::findOrCreate('workflow.tasks.view_own', 'web');
        Permission::findOrCreate('workflow.tasks.execute', 'web');
        $user->givePermissionTo(['workflow.tasks.view_own', 'workflow.tasks.execute']);

        return $user;
    }

    public function test_template_crud_publish_and_designer_persistence(): void
    {
        $user = $this->adminUser();
        $this->actingAs($user);

        $templates = app(WorkflowTemplateService::class);
        $designer = app(WorkflowDesignerService::class);

        $template = $templates->create([
            'code' => 'TEST_FLOW',
            'name' => 'اختبار',
            'category' => 'custom',
        ]);

        $version = $template->versions()->first();
        $this->assertNotNull($version);

        $designer->saveGraph($version, [
            'nodes' => [
                [
                    'id' => 'n1',
                    'position' => ['x' => 0, 'y' => 0],
                    'data' => [
                        'name' => 'مرحلة 1',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => 1],
                    ],
                ],
                [
                    'id' => 'n2',
                    'position' => ['x' => 200, 'y' => 0],
                    'data' => [
                        'name' => 'مرحلة 2',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => 1],
                    ],
                ],
            ],
            'edges' => [['source' => 'n1', 'target' => 'n2']],
        ]);

        $version->refresh();
        $this->assertCount(2, $version->stages);
        $this->assertNotNull($version->stages->first()->next_stage_id);

        $published = $templates->publishVersion($version->fresh());
        $this->assertSame('published', $published->status->value);
        $template->refresh();
        $this->assertSame($published->id, $template->published_version_id);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $designer->saveGraph($published, ['nodes' => [], 'edges' => []]);
    }

    public function test_workflow_execution_single_employee_assignment(): void
    {
        $admin = $this->adminUser();
        $worker = $this->employeeUser();
        $employeeId = $worker->employee_id;

        $this->actingAs($admin);
        $templates = app(WorkflowTemplateService::class);
        $designer = app(WorkflowDesignerService::class);
        $execution = app(WorkflowExecutionService::class);

        $template = $templates->create(['code' => 'EXEC_TEST', 'name' => 'تنفيذ']);
        $version = $template->versions()->first();
        $designer->saveGraph($version, [
            'nodes' => [
                [
                    'id' => 's1',
                    'position' => ['x' => 0, 'y' => 0],
                    'data' => [
                        'name' => 'تنفيذ',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $employeeId],
                    ],
                ],
            ],
            'edges' => [],
        ]);
        $templates->publishVersion($version->fresh());

        $instance = $execution->start(['templateId' => $template->id]);
        $this->assertStringStartsWith('WF-', $instance->workflow_number);
        $this->assertCount(1, $instance->tasks);

        $this->actingAs($worker);
        $task = $instance->tasks->first();
        $execution->acceptTask($task);
        $execution->completeTask($task);
        $instance->refresh();
        $this->assertSame('completed', $instance->status->value);
    }

    public function test_checklist_blocks_completion_when_required(): void
    {
        $admin = $this->adminUser();
        $worker = $this->employeeUser();

        $this->actingAs($admin);
        $templates = app(WorkflowTemplateService::class);
        $designer = app(WorkflowDesignerService::class);
        $execution = app(WorkflowExecutionService::class);

        $template = $templates->create(['code' => 'CHK_TEST', 'name' => 'قائمة']);
        $version = $template->versions()->first();
        $designer->saveGraph($version, [
            'nodes' => [
                [
                    'id' => 's1',
                    'position' => ['x' => 0, 'y' => 0],
                    'data' => [
                        'name' => 'فحص',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $worker->employee_id],
                        'checklistRequired' => true,
                        'checklist' => [['label' => 'بند 1', 'isRequired' => true]],
                    ],
                ],
            ],
            'edges' => [],
        ]);
        $templates->publishVersion($version->fresh());
        $instance = $execution->start(['templateId' => $template->id]);
        $task = $instance->tasks->first();

        $this->actingAs($worker);
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $execution->completeTask($task, []);
    }

    public function test_sla_marks_overdue_and_creates_alert(): void
    {
        $admin = $this->adminUser();
        $this->actingAs($admin);

        $instance = app(WorkflowExecutionService::class)->start([
            'templateId' => $this->seedPublishedTemplate($admin->employee_id ?? Employee::create([
                'code' => 'E2', 'name' => 'E2', 'is_active' => true,
            ])->id)->id,
        ]);

        $task = $instance->tasks->first();
        $task->update(['due_at' => now()->subHour()]);

        $count = app(WorkflowSlaService::class)->checkOverdue();
        $this->assertGreaterThanOrEqual(1, $count);

        $task->refresh();
        $this->assertTrue($task->is_overdue);
        $this->assertTrue(Alert::query()->where('alertable_type', WorkflowTask::class)->exists());
    }

    public function test_start_workflow_from_maintenance_ticket_via_api(): void
    {
        $user = $this->adminUser();
        $this->actingAs($user);

        $employee = Employee::create(['code' => 'EMP-M', 'name' => 'فني', 'is_active' => true]);
        $templates = app(WorkflowTemplateService::class);
        $designer = app(WorkflowDesignerService::class);
        $template = $templates->create(['code' => 'MAINTENANCE_REQUEST', 'name' => 'صيانة']);
        $version = $template->versions()->first();
        $designer->saveGraph($version, [
            'nodes' => [[
                'id' => 's1',
                'position' => ['x' => 0, 'y' => 0],
                'data' => [
                    'name' => 'معالجة',
                    'assignmentType' => 'single_employee',
                    'assignmentConfig' => ['employeeId' => $employee->id],
                ],
            ]],
            'edges' => [],
        ]);
        $templates->publishVersion($version->fresh());

        $machineType = MachineType::create(['code' => 'inj', 'name' => 'حقن']);
        $machine = Machine::create([
            'machine_type_id' => $machineType->id,
            'code' => 'M1',
            'name' => 'آلة',
            'status' => 'stopped',
        ]);

        $instance = app(WorkflowExecutionService::class)->start([
            'templateId' => $template->id,
            'subjectType' => 'maintenance_ticket',
            'subjectId' => MaintenanceTicket::create([
                'machine_id' => $machine->id,
                'title' => 'عطل',
                'status' => 'open',
            ])->id,
        ]);

        $this->assertNotNull($instance->subject_id);
    }

    public function test_purchase_request_integration(): void
    {
        $user = $this->adminUser();
        $this->actingAs($user);

        $employee = Employee::create(['code' => 'EMP-P', 'name' => 'مشتريات', 'is_active' => true]);
        $template = $this->seedPublishedTemplate($employee->id, 'PURCHASE_REQUEST');

        $response = $this->postJson('/api/v1/workflow/purchase-requests', [
            'title' => 'شراء مواد',
            'templateId' => $template->id,
            'requestedByEmployeeId' => $employee->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('purchase_requests', ['title' => 'شراء مواد']);
        $pr = PurchaseRequest::query()->first();
        $this->assertNotNull($pr->workflow_instance_id);
    }

    public function test_permissions_enforced_on_templates(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->getJson('/api/v1/workflow/templates')->assertForbidden();
    }

    public function test_gateway_transitions_routing_approve_and_reject(): void
    {
        $admin = $this->adminUser();
        $worker = $this->employeeUser();
        $employeeId = $worker->employee_id;

        $this->actingAs($admin);
        $templates = app(WorkflowTemplateService::class);
        $designer = app(WorkflowDesignerService::class);
        $execution = app(WorkflowExecutionService::class);

        $template = $templates->create(['code' => 'BRANCH_TEST', 'name' => 'تفرعات']);
        $version = $template->versions()->first();

        $designer->saveGraph($version, [
            'nodes' => [
                [
                    'id' => 's1',
                    'type' => 'workflowStage',
                    'position' => ['x' => 0, 'y' => 0],
                    'data' => [
                        'name' => 'مراجعة',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $employeeId],
                        'requiresApproval' => true,
                        'allowRejection' => true,
                    ],
                ],
                [
                    'id' => 'gw1',
                    'type' => 'workflowGateway',
                    'position' => ['x' => 0, 'y' => 120],
                    'data' => ['question' => 'موافق؟', 'gatewayType' => 'exclusive'],
                ],
                [
                    'id' => 's2',
                    'type' => 'workflowStage',
                    'position' => ['x' => -120, 'y' => 240],
                    'data' => [
                        'name' => 'معتمد',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $employeeId],
                    ],
                ],
                [
                    'id' => 's3',
                    'type' => 'workflowStage',
                    'position' => ['x' => 120, 'y' => 240],
                    'data' => [
                        'name' => 'إعادة عمل',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $employeeId],
                    ],
                ],
            ],
            'edges' => [
                ['source' => 's1', 'target' => 'gw1'],
                ['source' => 'gw1', 'target' => 's2', 'data' => ['conditionType' => 'on_approve', 'label' => 'نعم']],
                ['source' => 'gw1', 'target' => 's3', 'data' => ['conditionType' => 'on_reject', 'label' => 'لا']],
            ],
        ]);

        $version->refresh();
        $this->assertCount(3, $version->stages);
        $this->assertCount(2, $version->transitions);

        $templates->publishVersion($version->fresh());
        $instance = $execution->start(['templateId' => $template->id]);
        $task = $instance->tasks->first();

        $this->actingAs($worker);
        $execution->acceptTask($task);
        $execution->completeTask($task);
        $instance->refresh();
        $this->assertSame('waiting_approval', $instance->status->value);

        $this->actingAs($admin);
        $execution->approveTask($task->fresh());
        $instance->refresh();
        $this->assertSame('معتمد', $instance->currentStage?->name);

        $progress = $this->actingAs($admin)->getJson("/api/v1/workflow/instances/{$instance->id}/progress");
        $progress->assertOk();
        $progress->assertJsonPath('completedCount', 1);
        $progress->assertJsonPath('currentCount', 1);
        $progress->assertJsonPath('totalStages', 3);
    }

    public function test_reject_routes_to_rework_stage(): void
    {
        $admin = $this->adminUser();
        $worker = $this->employeeUser();
        $employeeId = $worker->employee_id;

        $this->actingAs($admin);
        $templates = app(WorkflowTemplateService::class);
        $designer = app(WorkflowDesignerService::class);
        $execution = app(WorkflowExecutionService::class);

        $template = $templates->create(['code' => 'REJECT_PATH', 'name' => 'رفض']);
        $version = $template->versions()->first();

        $designer->saveGraph($version, [
            'nodes' => [
                [
                    'id' => 's1',
                    'type' => 'workflowStage',
                    'position' => ['x' => 0, 'y' => 0],
                    'data' => [
                        'name' => 'فحص',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $employeeId],
                        'allowRejection' => true,
                    ],
                ],
                [
                    'id' => 'gw1',
                    'type' => 'workflowGateway',
                    'position' => ['x' => 0, 'y' => 120],
                    'data' => ['question' => 'مقبول؟'],
                ],
                [
                    'id' => 's2',
                    'type' => 'workflowStage',
                    'position' => ['x' => 0, 'y' => 240],
                    'data' => [
                        'name' => 'إعادة',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $employeeId],
                    ],
                ],
            ],
            'edges' => [
                ['source' => 's1', 'target' => 'gw1'],
                ['source' => 'gw1', 'target' => 's2', 'data' => ['conditionType' => 'on_reject', 'label' => 'لا']],
            ],
        ]);
        $templates->publishVersion($version->fresh());

        $instance = $execution->start(['templateId' => $template->id]);
        $task = $instance->tasks->first();

        $this->actingAs($worker);
        $execution->acceptTask($task);
        $execution->rejectTask($task, 'يحتاج تعديل');
        $instance->refresh();

        $this->assertSame('إعادة', $instance->currentStage?->name);
        $this->assertSame('in_progress', $instance->status->value);
    }

    public function test_complete_stage_with_gateway_pauses_for_path_decision(): void
    {
        $admin = $this->adminUser();
        $worker = $this->employeeUser();
        $supervisorEmployee = Employee::create([
            'code' => 'EMP-WF-SUP',
            'name' => 'مشرف',
            'is_active' => true,
        ]);
        $employeeId = $worker->employee_id;
        $supervisorId = $supervisorEmployee->id;

        $this->actingAs($admin);
        $templates = app(WorkflowTemplateService::class);
        $designer = app(WorkflowDesignerService::class);
        $execution = app(WorkflowExecutionService::class);

        $template = $templates->create(['code' => 'GW_DECIDE', 'name' => 'قرار مسار']);
        $version = $template->versions()->first();

        $designer->saveGraph($version, [
            'nodes' => [
                [
                    'id' => 's1',
                    'type' => 'workflowStage',
                    'position' => ['x' => 0, 'y' => 0],
                    'data' => [
                        'name' => 'تشخيص',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $employeeId],
                    ],
                ],
                [
                    'id' => 'gw1',
                    'type' => 'workflowGateway',
                    'position' => ['x' => 0, 'y' => 120],
                    'data' => ['question' => 'إصلاح ميداني؟'],
                ],
                [
                    'id' => 's2',
                    'type' => 'workflowStage',
                    'position' => ['x' => -120, 'y' => 240],
                    'data' => [
                        'name' => 'إصلاح',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $employeeId],
                    ],
                ],
                [
                    'id' => 's3',
                    'type' => 'workflowStage',
                    'position' => ['x' => 120, 'y' => 240],
                    'data' => [
                        'name' => 'قطع غيار',
                        'assignmentType' => 'single_employee',
                        'assignmentConfig' => ['employeeId' => $supervisorId],
                    ],
                ],
            ],
            'edges' => [
                ['source' => 's1', 'target' => 'gw1'],
                ['source' => 'gw1', 'target' => 's2', 'data' => ['conditionType' => 'on_approve', 'label' => 'نعم']],
                ['source' => 'gw1', 'target' => 's3', 'data' => ['conditionType' => 'on_reject', 'label' => 'لا']],
            ],
        ]);
        $templates->publishVersion($version->fresh());

        $instance = $execution->start(['templateId' => $template->id]);
        $task = $instance->tasks->first();

        $this->actingAs($worker);
        $execution->acceptTask($task);
        $execution->completeTask($task);
        $instance->refresh();

        $this->assertSame('waiting_approval', $instance->status->value);
        $this->assertSame('تشخيص', $instance->currentStage?->name);
        $decision = $execution->resolveGatewayDecision($instance);
        $this->assertNotNull($decision);
        $this->assertSame($task->id, $decision['taskId']);
        $this->assertCount(2, $decision['options']);

        $execution->chooseGatewayPath($task->fresh(), \App\Domain\Factory\Enums\WorkflowTransitionConditionType::OnReject);
        $instance->refresh();

        $this->assertSame('قطع غيار', $instance->currentStage?->name);
        $this->assertSame('in_progress', $instance->status->value);
        $partsTask = $instance->tasks()->where('stage_id', $instance->current_stage_id)->first();
        $this->assertSame($supervisorId, $partsTask?->assigned_to);
    }

    private function seedPublishedTemplate(int $employeeId, string $code = 'AUTO'): WorkflowTemplate
    {
        $templates = app(WorkflowTemplateService::class);
        $designer = app(WorkflowDesignerService::class);
        $template = $templates->create(['code' => $code, 'name' => $code]);
        $version = $template->versions()->first();
        $designer->saveGraph($version, [
            'nodes' => [[
                'id' => 's1',
                'position' => ['x' => 0, 'y' => 0],
                'data' => [
                    'name' => 'خطوة',
                    'assignmentType' => 'single_employee',
                    'assignmentConfig' => ['employeeId' => $employeeId],
                ],
            ]],
            'edges' => [],
        ]);
        $templates->publishVersion($version->fresh());

        return $template->fresh();
    }
}
