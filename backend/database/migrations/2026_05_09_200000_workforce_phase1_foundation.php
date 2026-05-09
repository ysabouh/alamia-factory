<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Mirrors PROJECT_ARCHITECTURE.md phase-1 workforce tables (adapted for MySQL + Laravel).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('halls', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('hall_type')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('departments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('hall_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('job_roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedTinyInteger('role_level')->default(1);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('employment_statuses', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->timestamps();
        });

        Schema::table('shifts', function (Blueprint $table): void {
            $table->string('code')->nullable()->unique()->after('name');
        });

        Schema::table('employees', function (Blueprint $table): void {
            $table->string('employee_number')->nullable()->after('id');
            $table->string('first_name')->nullable()->after('code');
            $table->string('last_name')->nullable()->after('first_name');

            $table->string('gender', 40)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('emergency_phone')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('national_id')->nullable();
            $table->text('address')->nullable();

            $table->date('hire_date')->nullable();

            $table->foreignId('hall_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('job_role_id')->nullable()->constrained('job_roles')->nullOnDelete();
            $table->foreignId('shift_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('employment_status_id')->nullable()->constrained('employment_statuses')->nullOnDelete();

            $table->decimal('basic_salary', 14, 2)->default(0);
            $table->decimal('overtime_hour_rate', 10, 2)->default(0);
            $table->decimal('performance_score', 7, 2)->default(0);
            $table->decimal('reliability_score', 7, 2)->default(0);
            $table->decimal('safety_score', 7, 2)->default(0);

            $table->unsignedInteger('annual_leave_balance')->default(0);

            $table->string('profile_image')->nullable();
            $table->text('notes')->nullable();
        });

        Schema::table('employees', function (Blueprint $table): void {
            $table->unique('employee_number');
            $table->index('department_id', 'employees_department_idx');
            $table->index('shift_id', 'employees_shift_idx');
            $table->index('job_role_id', 'employees_job_role_idx');
            $table->index('employment_status_id', 'employees_employment_status_idx');
            $table->index('hall_id', 'employees_hall_idx');
        });

        DB::table('employees')->whereNull('employee_number')->update([
            'employee_number' => DB::raw('code'),
        ]);

        foreach (DB::table('employees')->cursor() as $row) {
            $name = trim((string) $row->name);
            $parts = preg_split('/\s+/u', $name, 2);

            DB::table('employees')->where('id', '=', $row->id)->update([
                'first_name' => $parts[0] !== '' ? $parts[0] : $name,
                'last_name' => isset($parts[1]) ? $parts[1] : '',
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table): void {
            $table->dropForeign(['employment_status_id']);
            $table->dropForeign(['shift_id']);
            $table->dropForeign(['job_role_id']);
            $table->dropForeign(['department_id']);
            $table->dropForeign(['hall_id']);

            $table->dropUnique(['employee_number']);
            $table->dropIndex('employees_department_idx');
            $table->dropIndex('employees_shift_idx');
            $table->dropIndex('employees_job_role_idx');
            $table->dropIndex('employees_employment_status_idx');
            $table->dropIndex('employees_hall_idx');

            $table->dropColumn([
                'employee_number', 'first_name', 'last_name', 'gender', 'birth_date', 'emergency_phone',
                'email', 'national_id', 'address', 'hire_date', 'hall_id', 'department_id', 'job_role_id',
                'shift_id', 'employment_status_id', 'basic_salary', 'overtime_hour_rate', 'performance_score',
                'reliability_score', 'safety_score', 'annual_leave_balance', 'profile_image', 'notes',
            ]);
        });

        Schema::table('shifts', function (Blueprint $table): void {
            if (! Schema::hasColumn('shifts', 'code')) {
                return;
            }
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });

        Schema::dropIfExists('employment_statuses');
        Schema::dropIfExists('job_roles');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('halls');
    }
};
