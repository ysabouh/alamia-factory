<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('departments') && ! Schema::hasColumn('departments', 'parent_id')) {
            Schema::table('departments', function (Blueprint $table): void {
                $table->foreignId('parent_id')
                    ->nullable()
                    ->after('hall_id')
                    ->constrained('departments')
                    ->restrictOnDelete();
                $table->index(['parent_id', 'is_active']);
            });
        }

        if (! Schema::hasTable('department_org_positions')) {
            Schema::create('department_org_positions', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('department_id')->constrained('departments')->restrictOnDelete();
                $table->string('name', 150);
                $table->string('code', 50);
                $table->text('description')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->unsignedInteger('planned_headcount')->default(0);
                $table->unsignedInteger('vacancy_count')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['department_id', 'code']);
                $table->index(['department_id', 'is_active', 'sort_order'], 'dept_org_pos_dept_active_sort_idx');
            });
        }

        if (! Schema::hasTable('factory_org_settings')) {
            Schema::create('factory_org_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('scope', 50)->default('factory')->unique();
                $table->string('title', 200)->default('المصنع');
                $table->foreignId('general_manager_employee_id')
                    ->nullable()
                    ->constrained('employees')
                    ->nullOnDelete();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('employees') && ! Schema::hasColumn('employees', 'org_position_id')) {
            Schema::table('employees', function (Blueprint $table): void {
                $table->foreignId('org_position_id')
                    ->nullable()
                    ->after('department_id')
                    ->constrained('department_org_positions')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'org_position_id')) {
            Schema::table('employees', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('org_position_id');
            });
        }

        Schema::dropIfExists('factory_org_settings');
        Schema::dropIfExists('department_org_positions');

        if (Schema::hasTable('departments') && Schema::hasColumn('departments', 'parent_id')) {
            Schema::table('departments', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('parent_id');
            });
        }
    }
};
