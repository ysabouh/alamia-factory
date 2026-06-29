<?php

namespace Tests\Feature;

use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\DepartmentOrgPosition;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\Hall;
use App\Domain\Factory\Models\JobRole;
use App\Domain\Factory\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class OrgChartTest extends TestCase
{
    use RefreshDatabase;

    private function userWithPermissions(): User
    {
        $user = User::factory()->create();
        foreach (['workforce.view', 'workforce.manage_employees', 'workforce.manage_masters'] as $perm) {
            Permission::findOrCreate($perm, 'web');
        }
        $user->givePermissionTo(['workforce.view', 'workforce.manage_employees', 'workforce.manage_masters']);

        return $user;
    }

    public function test_org_chart_returns_nested_department_tree(): void
    {
        $user = $this->userWithPermissions();
        $hall = Hall::create(['code' => 'H1', 'name' => 'قاعة 1', 'is_active' => true]);
        $parent = Department::create([
            'hall_id' => $hall->id,
            'code' => 'PROD',
            'name' => 'إنتاج',
            'vacancy_count' => 0,
            'is_active' => true,
        ]);
        Department::create([
            'hall_id' => $hall->id,
            'parent_id' => $parent->id,
            'code' => 'INJ',
            'name' => 'حقن',
            'vacancy_count' => 0,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/workforce/org-chart');

        $response->assertOk()
            ->assertJsonPath('data.departmentTree.0.departmentId', (string) $parent->id)
            ->assertJsonPath('data.departmentTree.0.children.0.code', 'INJ')
            ->assertJsonStructure(['data' => ['factoryRoot', 'departmentTree', 'reportingEdges', 'employees']]);
    }

    public function test_org_chart_returns_department_stats_with_vacancy(): void
    {
        $user = $this->userWithPermissions();
        $hall = Hall::create(['code' => 'H1', 'name' => 'قاعة 1', 'is_active' => true]);
        $dept = Department::create([
            'hall_id' => $hall->id,
            'code' => 'PROD',
            'name' => 'إنتاج',
            'vacancy_count' => 3,
            'is_active' => true,
        ]);
        $role = JobRole::create(['code' => 'OP', 'name' => 'مشغّل', 'role_level' => 2, 'is_active' => true]);
        Employee::create([
            'code' => 'E1',
            'employee_number' => 'E1',
            'name' => 'موظف 1',
            'department_id' => $dept->id,
            'job_role_id' => $role->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/workforce/org-chart');

        $response->assertOk()
            ->assertJsonPath('data.departmentTree.0.stats.vacancyCount', 3)
            ->assertJsonPath('data.departmentTree.0.stats.employeeCount', 1);
    }

    public function test_org_chart_parent_department_rolls_up_employees_and_vacancies(): void
    {
        $user = $this->userWithPermissions();
        $hall = Hall::create(['code' => 'H1', 'name' => 'قاعة 1', 'is_active' => true]);
        $parent = Department::create([
            'hall_id' => $hall->id,
            'code' => 'PROD',
            'name' => 'إنتاج',
            'vacancy_count' => 0,
            'is_active' => true,
        ]);
        $child = Department::create([
            'hall_id' => $hall->id,
            'parent_id' => $parent->id,
            'code' => 'INJ',
            'name' => 'حقن',
            'vacancy_count' => 0,
            'is_active' => true,
        ]);
        $position = DepartmentOrgPosition::create([
            'department_id' => $child->id,
            'name' => 'مشرف',
            'code' => 'SUP',
            'planned_headcount' => 2,
            'vacancy_count' => 0,
            'is_active' => true,
        ]);
        $role = JobRole::create(['code' => 'OP', 'name' => 'مشغّل', 'role_level' => 2, 'is_active' => true]);
        Employee::create([
            'code' => 'E1',
            'employee_number' => 'E1',
            'name' => 'موظف 1',
            'department_id' => $child->id,
            'org_position_id' => $position->id,
            'job_role_id' => $role->id,
            'performance_score' => 88,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/workforce/org-chart');

        $response->assertOk()
            ->assertJsonPath('data.departmentTree.0.stats.employeeCount', 1)
            ->assertJsonPath('data.departmentTree.0.stats.vacancyCount', 1)
            ->assertJsonPath('data.departmentTree.0.children.0.stats.employeeCount', 1)
            ->assertJsonPath('data.departmentTree.0.children.0.stats.vacancyCount', 1)
            ->assertJsonPath('data.departmentTree.0.children.0.positions.0.performanceScore', 88)
            ->assertJsonPath('data.departmentTree.0.children.0.positions.0.vacancyCount', 1);
    }

    public function test_rejects_org_position_on_non_leaf_department(): void
    {
        $user = $this->userWithPermissions();
        $hall = Hall::create(['code' => 'H1', 'name' => 'قاعة 1', 'is_active' => true]);
        $parent = Department::create([
            'hall_id' => $hall->id,
            'code' => 'PROD',
            'name' => 'إنتاج',
            'is_active' => true,
        ]);
        Department::create([
            'hall_id' => $hall->id,
            'parent_id' => $parent->id,
            'code' => 'INJ',
            'name' => 'حقن',
            'is_active' => true,
        ]);

        $this->actingAs($user)->postJson("/api/v1/workforce/masters/departments/{$parent->id}/org-positions", [
            'name' => 'مشرف',
            'code' => 'SUP',
        ])->assertStatus(422);
    }

    public function test_can_create_org_position_on_leaf_department(): void
    {
        $user = $this->userWithPermissions();
        $hall = Hall::create(['code' => 'H1', 'name' => 'قاعة 1', 'is_active' => true]);
        $dept = Department::create([
            'hall_id' => $hall->id,
            'code' => 'INJ',
            'name' => 'حقن',
            'is_active' => true,
        ]);

        $this->actingAs($user)->postJson("/api/v1/workforce/masters/departments/{$dept->id}/org-positions", [
            'name' => 'مشرف',
            'code' => 'SUP',
        ])->assertCreated()
            ->assertJsonPath('data.code', 'SUP');
    }

    public function test_rejects_org_position_department_mismatch_on_employee(): void
    {
        $user = $this->userWithPermissions();
        $hall = Hall::create(['code' => 'H1', 'name' => 'قاعة 1', 'is_active' => true]);
        $deptA = Department::create(['hall_id' => $hall->id, 'code' => 'A', 'name' => 'أ', 'is_active' => true]);
        $deptB = Department::create(['hall_id' => $hall->id, 'code' => 'B', 'name' => 'ب', 'is_active' => true]);
        $position = DepartmentOrgPosition::create([
            'department_id' => $deptB->id,
            'name' => 'مشرف',
            'code' => 'SUP',
            'is_active' => true,
        ]);
        $mgr = JobRole::create(['code' => 'MGR', 'name' => 'مدير', 'role_level' => 8, 'is_active' => true]);
        $manager = Employee::create([
            'code' => 'M1',
            'employee_number' => 'M1',
            'name' => 'مدير',
            'department_id' => $deptA->id,
            'job_role_id' => $mgr->id,
            'is_active' => true,
        ]);
        $worker = Employee::create([
            'code' => 'W1',
            'employee_number' => 'W1',
            'name' => 'عامل',
            'department_id' => $deptA->id,
            'reports_to_id' => $manager->id,
            'is_active' => true,
        ]);

        $this->actingAs($user)->patchJson("/api/v1/workforce/employees/{$worker->id}", [
            'orgPositionId' => $position->id,
        ])->assertStatus(422);
    }

    public function test_can_clear_department_with_explicit_null(): void
    {
        $user = $this->userWithPermissions();
        $hall = Hall::create(['code' => 'H1', 'name' => 'قاعة 1', 'is_active' => true]);
        $dept = Department::create(['hall_id' => $hall->id, 'code' => 'A', 'name' => 'أ', 'is_active' => true]);
        $mgr = JobRole::create(['code' => 'MGR', 'name' => 'مدير', 'role_level' => 8, 'is_active' => true]);
        $manager = Employee::create([
            'code' => 'M1',
            'employee_number' => 'M1',
            'name' => 'مدير',
            'department_id' => $dept->id,
            'job_role_id' => $mgr->id,
            'is_active' => true,
        ]);
        $worker = Employee::create([
            'code' => 'W1',
            'employee_number' => 'W1',
            'name' => 'عامل',
            'department_id' => $dept->id,
            'reports_to_id' => $manager->id,
            'is_active' => true,
        ]);

        $this->actingAs($user)->patchJson("/api/v1/workforce/employees/{$worker->id}", [
            'departmentId' => null,
            'orgPositionId' => null,
        ])->assertOk()
            ->assertJsonPath('departmentId', null);

        $this->assertDatabaseHas('employees', [
            'id' => $worker->id,
            'department_id' => null,
            'org_position_id' => null,
        ]);
    }

    public function test_can_update_reporting_hierarchy(): void
    {
        $user = $this->userWithPermissions();
        $role = JobRole::create(['code' => 'MGR', 'name' => 'مدير', 'role_level' => 8, 'is_active' => true]);
        $manager = Employee::create([
            'code' => 'M1',
            'employee_number' => 'M1',
            'name' => 'مدير',
            'job_role_id' => $role->id,
            'is_active' => true,
        ]);
        $worker = Employee::create([
            'code' => 'W1',
            'employee_number' => 'W1',
            'name' => 'عامل',
            'is_active' => true,
        ]);

        $this->actingAs($user)->patchJson("/api/v1/workforce/employees/{$worker->id}/reporting", [
            'reportsToId' => $manager->id,
        ])->assertOk();

        $this->assertDatabaseHas('employees', [
            'id' => $worker->id,
            'reports_to_id' => $manager->id,
        ]);
    }

    public function test_rejects_circular_reporting(): void
    {
        $user = $this->userWithPermissions();
        $a = Employee::create(['code' => 'A', 'employee_number' => 'A', 'name' => 'A', 'is_active' => true]);
        $b = Employee::create([
            'code' => 'B',
            'employee_number' => 'B',
            'name' => 'B',
            'reports_to_id' => $a->id,
            'is_active' => true,
        ]);

        $this->actingAs($user)->patchJson("/api/v1/workforce/employees/{$a->id}/reporting", [
            'reportsToId' => $b->id,
        ])->assertStatus(422);
    }

    public function test_department_requires_manager_on_create(): void
    {
        $user = $this->userWithPermissions();
        $hall = Hall::create(['code' => 'H1', 'name' => 'قاعة 1', 'is_active' => true]);
        $manager = Employee::create([
            'code' => 'M1',
            'employee_number' => 'M1',
            'name' => 'مدير القسم',
            'is_active' => true,
        ]);

        $this->actingAs($user)->postJson('/api/v1/workforce/masters/departments', [
            'name' => 'إنتاج',
            'code' => 'PROD',
            'hallId' => $hall->id,
        ])->assertStatus(422);

        $this->actingAs($user)->postJson('/api/v1/workforce/masters/departments', [
            'name' => 'إنتاج',
            'code' => 'PROD',
            'hallId' => $hall->id,
            'managerId' => $manager->id,
        ])->assertCreated()
            ->assertJsonPath('data.managerId', (string) $manager->id);

        $this->assertDatabaseHas('employees', [
            'id' => $manager->id,
            'department_id' => Department::query()->where('code', 'PROD')->value('id'),
        ]);
    }

    public function test_org_chart_shows_department_manager_when_department_id_differs(): void
    {
        $user = $this->userWithPermissions();
        $hall = Hall::create(['code' => 'H1', 'name' => 'قاعة 1', 'is_active' => true]);
        $otherDept = Department::create([
            'hall_id' => $hall->id,
            'code' => 'OTHER',
            'name' => 'قسم آخر',
            'is_active' => true,
        ]);
        $managedDept = Department::create([
            'hall_id' => $hall->id,
            'code' => 'INJ',
            'name' => 'حقن',
            'is_active' => true,
        ]);
        $manager = Employee::create([
            'code' => 'YM',
            'employee_number' => 'YM',
            'name' => 'ياسمين القحطاني',
            'first_name' => 'ياسمين',
            'last_name' => 'القحطاني',
            'department_id' => $otherDept->id,
            'is_active' => true,
        ]);
        $managedDept->update(['manager_id' => $manager->id]);

        $response = $this->actingAs($user)->getJson('/api/v1/workforce/org-chart');

        $response->assertOk()
            ->assertJsonPath('data.departmentTree.0.departmentId', (string) $managedDept->id)
            ->assertJsonPath('data.departmentTree.0.managerEmployee.fullName', 'ياسمين القحطاني')
            ->assertJsonPath('data.departmentTree.0.stats.employeeCount', 1);
    }

    public function test_factory_settings_endpoint(): void
    {
        $user = $this->userWithPermissions();

        $this->actingAs($user)->getJson('/api/v1/workforce/org-chart/factory-settings')
            ->assertOk()
            ->assertJsonPath('data.title', 'المصنع');

        $this->actingAs($user)->patchJson('/api/v1/workforce/org-chart/factory-settings', [
            'title' => 'مصنع النموذج',
        ])->assertOk()
            ->assertJsonPath('data.title', 'مصنع النموذج');
    }

    public function test_org_chart_layout_settings_defaults(): void
    {
        $user = $this->userWithPermissions();

        $this->actingAs($user)->getJson('/api/v1/workforce/org-chart/settings')
            ->assertOk()
            ->assertJsonPath('data.settings.layoutMode', 'auto')
            ->assertJsonPath('data.settings.direction', 'TB')
            ->assertJsonPath('data.positions', []);
    }

    public function test_can_update_layout_settings_and_positions(): void
    {
        $user = $this->userWithPermissions();

        $this->actingAs($user)->patchJson('/api/v1/workforce/org-chart/settings', [
            'layoutMode' => 'manual',
            'nodeSep' => 60,
            'departmentColors' => ['PROD' => '#ff0000'],
        ])->assertOk()
            ->assertJsonPath('data.settings.layoutMode', 'manual')
            ->assertJsonPath('data.settings.nodeSep', 60)
            ->assertJsonPath('data.settings.departmentColors.PROD', '#ff0000');

        $this->actingAs($user)->patchJson('/api/v1/workforce/org-chart/positions', [
            'positions' => [
                'emp-1' => ['x' => 120, 'y' => 340],
            ],
        ])->assertOk()
            ->assertJsonPath('data.positions.emp-1.x', 120)
            ->assertJsonPath('data.positions.emp-1.y', 340);

        $this->actingAs($user)->postJson('/api/v1/workforce/org-chart/positions/reset')
            ->assertOk()
            ->assertJsonPath('data.positions', []);
    }
}
