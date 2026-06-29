<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('workflow_templates')) {
            Schema::create('workflow_templates', function (Blueprint $table): void {
                $table->id();
                $table->string('code', 60)->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('category', 40)->default('custom');
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->string('default_priority', 20)->default('normal');
                $table->unsignedBigInteger('published_version_id')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
                $table->index(['category', 'is_active']);
            });
        }

        if (! Schema::hasTable('workflow_template_versions')) {
            Schema::create('workflow_template_versions', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('template_id')->constrained('workflow_templates')->cascadeOnDelete();
                $table->unsignedInteger('version')->default(1);
                $table->string('status', 20)->default('draft');
                $table->json('definition_json')->nullable();
                $table->timestamp('published_at')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->unique(['template_id', 'version']);
            });
        }

        Schema::table('workflow_templates', function (Blueprint $table): void {
            if (! Schema::hasColumn('workflow_templates', 'published_version_id')) {
                return;
            }
            $table->foreign('published_version_id')
                ->references('id')
                ->on('workflow_template_versions')
                ->nullOnDelete();
        });

        if (! Schema::hasTable('workflow_stages')) {
            Schema::create('workflow_stages', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('template_version_id')->constrained('workflow_template_versions')->cascadeOnDelete();
                $table->unsignedInteger('stage_number');
                $table->string('name');
                $table->text('description')->nullable();
                $table->unsignedInteger('estimated_duration_minutes')->nullable();
                $table->unsignedInteger('sla_duration_minutes')->nullable();
                $table->string('assignment_type', 40)->default('single_employee');
                $table->json('assignment_config')->nullable();
                $table->boolean('requires_approval')->default(false);
                $table->boolean('allow_rejection')->default(false);
                $table->boolean('allow_return')->default(false);
                $table->boolean('checklist_required')->default(false);
                $table->json('required_attachments')->nullable();
                $table->unsignedBigInteger('next_stage_id')->nullable();
                $table->decimal('position_x', 10, 2)->nullable();
                $table->decimal('position_y', 10, 2)->nullable();
                $table->string('node_id', 80)->nullable();
                $table->timestamps();
                $table->unique(['template_version_id', 'stage_number'], 'wf_stage_version_num_uq');
            });
        }

        Schema::table('workflow_stages', function (Blueprint $table): void {
            if (Schema::hasColumn('workflow_stages', 'next_stage_id')) {
                $table->foreign('next_stage_id')->references('id')->on('workflow_stages')->nullOnDelete();
            }
        });

        if (! Schema::hasTable('workflow_stage_checklist_items')) {
            Schema::create('workflow_stage_checklist_items', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('stage_id')->constrained('workflow_stages')->cascadeOnDelete();
                $table->string('label');
                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_required')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('workflow_instances')) {
            Schema::create('workflow_instances', function (Blueprint $table): void {
                $table->id();
                $table->string('workflow_number', 40)->unique();
                $table->foreignId('template_version_id')->constrained('workflow_template_versions')->restrictOnDelete();
                $table->foreignId('current_stage_id')->nullable()->constrained('workflow_stages')->nullOnDelete();
                $table->string('status', 30)->default('draft');
                $table->string('priority', 20)->default('normal');
                $table->unsignedTinyInteger('progress_percent')->default(0);
                $table->timestamp('started_at')->nullable();
                $table->timestamp('due_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->nullableMorphs('subject', 'wf_instance_subject_idx');
                $table->foreignId('initiated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
                $table->index(['status', 'due_at']);
            });
        }

        if (! Schema::hasTable('workflow_tasks')) {
            Schema::create('workflow_tasks', function (Blueprint $table): void {
                $table->id();
                $table->string('task_number', 40)->unique();
                $table->foreignId('instance_id')->constrained('workflow_instances')->cascadeOnDelete();
                $table->foreignId('stage_id')->constrained('workflow_stages')->restrictOnDelete();
                $table->foreignId('assigned_to')->nullable()->constrained('employees')->nullOnDelete();
                $table->unsignedInteger('sequence_order')->default(0);
                $table->string('status', 30)->default('pending');
                $table->string('priority', 20)->default('normal');
                $table->timestamp('due_at')->nullable();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('accepted_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->unsignedInteger('duration_minutes')->nullable();
                $table->boolean('is_overdue')->default(false);
                $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
                $table->index(['assigned_to', 'status'], 'wf_task_assignee_status_idx');
                $table->index(['instance_id', 'stage_id'], 'wf_task_instance_stage_idx');
            });
        }

        if (! Schema::hasTable('workflow_task_checklist_completions')) {
            Schema::create('workflow_task_checklist_completions', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('task_id')->constrained('workflow_tasks')->cascadeOnDelete();
                $table->foreignId('checklist_item_id')->constrained('workflow_stage_checklist_items')->cascadeOnDelete();
                $table->boolean('is_completed')->default(false);
                $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
                $table->unique(['task_id', 'checklist_item_id'], 'wf_task_checklist_uq');
            });
        }

        if (! Schema::hasTable('workflow_task_comments')) {
            Schema::create('workflow_task_comments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('task_id')->constrained('workflow_tasks')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('type', 30)->default('comment');
                $table->text('body');
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('workflow_task_attachments')) {
            Schema::create('workflow_task_attachments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('task_id')->constrained('workflow_tasks')->cascadeOnDelete();
                $table->string('file_name');
                $table->string('file_path');
                $table->string('mime_type', 120)->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('workflow_timeline_entries')) {
            Schema::create('workflow_timeline_entries', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('instance_id')->constrained('workflow_instances')->cascadeOnDelete();
                $table->foreignId('task_id')->nullable()->constrained('workflow_tasks')->nullOnDelete();
                $table->string('action', 40);
                $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->json('meta')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->index(['instance_id', 'created_at'], 'wf_timeline_instance_idx');
            });
        }

        if (! Schema::hasTable('workflow_audit_logs')) {
            Schema::create('workflow_audit_logs', function (Blueprint $table): void {
                $table->id();
                $table->string('auditable_type');
                $table->unsignedBigInteger('auditable_id');
                $table->string('action', 40);
                $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->json('old_values')->nullable();
                $table->json('new_values')->nullable();
                $table->timestamp('created_at')->useCurrent();
                $table->index(['auditable_type', 'auditable_id'], 'wf_audit_morph_idx');
            });
        }

        if (! Schema::hasTable('workflow_notifications')) {
            Schema::create('workflow_notifications', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('instance_id')->nullable()->constrained('workflow_instances')->cascadeOnDelete();
                $table->foreignId('task_id')->nullable()->constrained('workflow_tasks')->cascadeOnDelete();
                $table->string('type', 40);
                $table->string('title');
                $table->text('message')->nullable();
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
                $table->index(['user_id', 'read_at'], 'wf_notif_user_read_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_notifications');
        Schema::dropIfExists('workflow_audit_logs');
        Schema::dropIfExists('workflow_timeline_entries');
        Schema::dropIfExists('workflow_task_attachments');
        Schema::dropIfExists('workflow_task_comments');
        Schema::dropIfExists('workflow_task_checklist_completions');
        Schema::dropIfExists('workflow_tasks');
        Schema::dropIfExists('workflow_instances');
        Schema::dropIfExists('workflow_stage_checklist_items');

        if (Schema::hasTable('workflow_templates')) {
            Schema::table('workflow_templates', function (Blueprint $table): void {
                if (Schema::hasColumn('workflow_templates', 'published_version_id')) {
                    $table->dropForeign(['published_version_id']);
                }
            });
        }

        Schema::dropIfExists('workflow_stages');
        Schema::dropIfExists('workflow_template_versions');
        Schema::dropIfExists('workflow_templates');
    }
};
