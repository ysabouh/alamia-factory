<?php

namespace Tests\Feature\DirectTasks;

use App\Application\DirectTasks\DirectTaskSpawnService;
use App\Domain\Factory\Enums\DirectTaskStatus;
use App\Domain\Factory\Enums\DirectTaskType;
use App\Domain\Factory\Models\DirectTask;
use App\Domain\Factory\Models\DirectTaskDraft;
use App\Domain\Factory\Models\DirectTaskSchedule;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class DirectTasksTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        $user = User::factory()->create();
        foreach (['direct_tasks.view', 'direct_tasks.create', 'direct_tasks.manage', 'direct_tasks.execute'] as $p) {
            Permission::findOrCreate($p, 'web');
        }
        $user->givePermissionTo(['direct_tasks.view', 'direct_tasks.create', 'direct_tasks.manage', 'direct_tasks.execute']);

        return $user;
    }

    public function test_create_one_time_direct_task_with_checklist_and_assignments(): void
    {
        $user = $this->creator();
        $employee = Employee::create(['code' => 'EMP-DT-1', 'name' => 'مسؤول', 'is_active' => true]);
        $this->actingAs($user);

        $response = $this->postJson('/api/v1/direct-tasks', [
            'title' => 'فحص المولدات',
            'description' => 'فحص دوري للمولدات الكهربائية',
            'category' => 'electrical_maintenance',
            'priority' => 'high',
            'taskType' => 'direct',
            'scheduling' => [
                'startDate' => now()->toDateString(),
                'executionTime' => '08:00',
                'dueAt' => now()->addDay()->toIso8601String(),
                'expectedDurationMinutes' => 60,
            ],
            'assignments' => [
                ['type' => 'employee', 'assigneeId' => $employee->id, 'label' => $employee->name],
            ],
            'checklist' => [
                ['label' => 'فحص الزيت', 'itemType' => 'checkbox', 'isRequired' => true, 'sortOrder' => 0],
            ],
            'options' => ['requireManagerApproval' => true],
            'notes' => 'ملاحظة',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('title', 'فحص المولدات');
        $this->assertDatabaseHas('direct_tasks', ['title' => 'فحص المولدات', 'status' => DirectTaskStatus::Assigned->value]);
        $this->assertDatabaseCount('direct_task_checklist_items', 1);
        $this->assertDatabaseCount('direct_task_assignments', 1);
    }

    public function test_save_and_load_draft(): void
    {
        $user = $this->creator();
        $this->actingAs($user);

        $this->patchJson('/api/v1/direct-tasks/drafts/current', [
            'payload' => ['title' => 'مسودة', 'taskType' => 'direct'],
        ])->assertOk();

        $this->assertDatabaseHas('direct_task_drafts', ['user_id' => $user->id]);

        $this->getJson('/api/v1/direct-tasks/drafts/current')
            ->assertOk()
            ->assertJsonPath('data.payload.title', 'مسودة');
    }

    public function test_recurring_schedule_spawns_task(): void
    {
        $user = $this->creator();
        $this->actingAs($user);

        $this->postJson('/api/v1/direct-tasks', [
            'title' => 'مهمة يومية',
            'description' => 'وصف',
            'category' => 'production',
            'priority' => 'normal',
            'taskType' => 'daily',
            'scheduling' => [
                'startDate' => now()->subDay()->toDateString(),
                'executionTime' => '08:00:00',
                'repeatEvery' => 1,
            ],
            'checklist' => [],
            'assignments' => [],
        ])->assertCreated();

        $schedule = DirectTaskSchedule::query()->first();
        $this->assertNotNull($schedule);
        $schedule->update(['next_run_at' => now()->subMinute()]);

        $before = DirectTask::query()->count();
        $spawned = app(DirectTaskSpawnService::class)->spawnDue();
        $this->assertGreaterThanOrEqual(1, $spawned);
        $this->assertGreaterThan($before, DirectTask::query()->count());
    }

    public function test_forbidden_without_permission(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->postJson('/api/v1/direct-tasks', [
            'title' => 'x',
            'description' => 'y',
            'category' => 'custom',
            'taskType' => 'direct',
        ])->assertForbidden();
    }

    public function test_upload_attachment(): void
    {
        Storage::fake('public');
        $user = $this->creator();
        $this->actingAs($user);

        $task = DirectTask::query()->create([
            'task_number' => 'DT-2026-00001',
            'title' => 'مرفقات',
            'description' => 'd',
            'category' => 'custom',
            'priority' => 'normal',
            'task_type' => DirectTaskType::Direct,
            'status' => DirectTaskStatus::Assigned,
        ]);

        $file = UploadedFile::fake()->create('report.pdf', 100, 'application/pdf');

        $this->postJson("/api/v1/direct-tasks/{$task->id}/attachments", [
            'file' => $file,
        ])->assertCreated();

        $this->assertDatabaseCount('direct_task_attachments', 1);
    }

    public function test_checklist_templates_list(): void
    {
        $this->seed(\Database\Seeders\DirectTaskChecklistTemplateSeeder::class);
        $user = $this->creator();
        $this->actingAs($user);

        $this->getJson('/api/v1/direct-tasks/checklist-templates')
            ->assertOk()
            ->assertJsonCount(5, 'data');
    }
}
