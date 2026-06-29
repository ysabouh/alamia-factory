<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('direct_task_checklist_templates')) {
            Schema::create('direct_task_checklist_templates', function (Blueprint $table): void {
                $table->id();
                $table->string('code', 60)->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('direct_task_checklist_template_items')) {
            Schema::create('direct_task_checklist_template_items', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('template_id')->constrained('direct_task_checklist_templates')->cascadeOnDelete();
                $table->string('label');
                $table->string('item_type', 30)->default('checkbox');
                $table->boolean('is_required')->default(false);
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('direct_task_schedules')) {
            Schema::create('direct_task_schedules', function (Blueprint $table): void {
                $table->id();
                $table->string('schedule_number', 40)->unique();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('category', 40);
                $table->string('priority', 20)->default('normal');
                $table->string('task_type', 20);
                $table->date('start_date')->nullable();
                $table->time('execution_time')->nullable();
                $table->unsignedInteger('expected_duration_minutes')->nullable();
                $table->unsignedInteger('reminder_minutes_before')->nullable();
                $table->unsignedSmallInteger('repeat_every')->default(1);
                $table->json('weekdays')->nullable();
                $table->unsignedTinyInteger('month_day')->nullable();
                $table->json('options')->nullable();
                $table->text('notes')->nullable();
                $table->timestamp('next_run_at')->nullable();
                $table->timestamp('last_run_at')->nullable();
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index(['is_active', 'next_run_at'], 'dt_sched_active_next_idx');
            });
        }

        if (! Schema::hasTable('direct_tasks')) {
            Schema::create('direct_tasks', function (Blueprint $table): void {
                $table->id();
                $table->string('task_number', 40)->unique();
                $table->foreignId('schedule_id')->nullable()->constrained('direct_task_schedules')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('category', 40);
                $table->string('priority', 20)->default('normal');
                $table->string('task_type', 20);
                $table->string('status', 30)->default('pending');
                $table->date('start_date')->nullable();
                $table->time('execution_time')->nullable();
                $table->timestamp('due_at')->nullable();
                $table->unsignedInteger('expected_duration_minutes')->nullable();
                $table->timestamp('reminder_at')->nullable();
                $table->json('options')->nullable();
                $table->text('notes')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->boolean('is_overdue')->default(false);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
                $table->index(['status', 'due_at'], 'dt_task_status_due_idx');
            });
        }

        if (! Schema::hasTable('direct_task_checklist_items')) {
            Schema::create('direct_task_checklist_items', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('schedule_id')->nullable()->constrained('direct_task_schedules')->cascadeOnDelete();
                $table->foreignId('task_id')->nullable()->constrained('direct_tasks')->cascadeOnDelete();
                $table->string('label');
                $table->string('item_type', 30)->default('checkbox');
                $table->boolean('is_required')->default(false);
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->boolean('is_completed')->default(false);
                $table->text('response_value')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('direct_task_assignments')) {
            Schema::create('direct_task_assignments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('schedule_id')->nullable()->constrained('direct_task_schedules')->cascadeOnDelete();
                $table->foreignId('task_id')->nullable()->constrained('direct_tasks')->cascadeOnDelete();
                $table->string('assignment_type', 20);
                $table->unsignedBigInteger('assignee_id');
                $table->string('assignee_label')->nullable();
                $table->timestamps();
                $table->index(['task_id', 'assignment_type'], 'dt_assign_task_type_idx');
            });
        }

        if (! Schema::hasTable('direct_task_attachments')) {
            Schema::create('direct_task_attachments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('task_id')->constrained('direct_tasks')->cascadeOnDelete();
                $table->string('file_name');
                $table->string('file_path');
                $table->string('mime_type', 120)->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('direct_task_drafts')) {
            Schema::create('direct_task_drafts', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->json('payload');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('direct_task_drafts');
        Schema::dropIfExists('direct_task_attachments');
        Schema::dropIfExists('direct_task_assignments');
        Schema::dropIfExists('direct_task_checklist_items');
        Schema::dropIfExists('direct_tasks');
        Schema::dropIfExists('direct_task_schedules');
        Schema::dropIfExists('direct_task_checklist_template_items');
        Schema::dropIfExists('direct_task_checklist_templates');
    }
};
