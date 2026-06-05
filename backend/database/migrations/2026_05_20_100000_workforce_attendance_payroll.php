<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shifts', function (Blueprint $table): void {
            $table->unsignedSmallInteger('break_minutes')->default(0)->after('ends_at');
            $table->decimal('overtime_multiplier', 4, 2)->default(1.50)->after('break_minutes');
            $table->decimal('friday_multiplier', 4, 2)->default(2.00)->after('overtime_multiplier');
            $table->softDeletes();
            $table->index(['is_active', 'code'], 'shifts_active_code_idx');
        });

        Schema::create('employee_shifts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('shift_id')->constrained('shifts')->restrictOnDelete();
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['employee_id', 'is_active'], 'employee_shifts_employee_active_idx');
            $table->index(['effective_from', 'effective_to'], 'employee_shifts_effective_idx');
        });

        Schema::create('attendance_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('attendance_date');
            $table->dateTime('check_in')->nullable();
            $table->dateTime('check_out')->nullable();

            $table->unsignedInteger('worked_minutes')->default(0);
            $table->unsignedInteger('overtime_minutes')->default(0);
            $table->unsignedInteger('friday_overtime_minutes')->default(0);
            $table->unsignedInteger('late_minutes')->default(0);
            $table->unsignedInteger('early_leave_minutes')->default(0);

            $table->enum('attendance_status', [
                'present',
                'absent',
                'late',
                'leave',
                'holiday',
                'weekend',
                'remote',
                'mission',
            ])->default('absent');

            $table->decimal('hourly_rate', 12, 4)->default(0);
            $table->decimal('overtime_hourly_rate', 12, 4)->default(0);
            $table->decimal('friday_hourly_rate', 12, 4)->default(0);
            $table->decimal('regular_pay', 14, 2)->default(0);
            $table->decimal('overtime_pay', 14, 2)->default(0);
            $table->decimal('friday_overtime_pay', 14, 2)->default(0);
            $table->decimal('total_pay', 14, 2)->default(0);

            $table->foreignId('approved_by_supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['employee_id', 'attendance_date'], 'attendance_employee_date_unique');
            $table->index('attendance_date', 'attendance_date_idx');
            $table->index(['attendance_status', 'attendance_date'], 'attendance_status_date_idx');
        });

        Schema::create('overtime_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('overtime_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('approved_hours', 6, 2)->default(0);
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['employee_id', 'overtime_date'], 'overtime_employee_date_idx');
            $table->index(['status', 'overtime_date'], 'overtime_status_date_idx');
        });

        Schema::create('payrolls', function (Blueprint $table): void {
            $table->id();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->enum('status', ['draft', 'locked', 'paid'])->default('draft');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('total_regular_pay', 16, 2)->default(0);
            $table->decimal('total_overtime_pay', 16, 2)->default(0);
            $table->decimal('total_friday_overtime_pay', 16, 2)->default(0);
            $table->decimal('total_amount', 16, 2)->default(0);
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['year', 'month'], 'payrolls_year_month_unique');
        });

        Schema::create('payroll_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('payroll_id')->constrained('payrolls')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->unsignedSmallInteger('days_present')->default(0);
            $table->unsignedSmallInteger('days_absent')->default(0);
            $table->unsignedInteger('total_worked_minutes')->default(0);
            $table->unsignedInteger('total_overtime_minutes')->default(0);
            $table->unsignedInteger('total_friday_overtime_minutes')->default(0);
            $table->decimal('regular_pay', 14, 2)->default(0);
            $table->decimal('overtime_pay', 14, 2)->default(0);
            $table->decimal('friday_overtime_pay', 14, 2)->default(0);
            $table->decimal('total_pay', 14, 2)->default(0);
            $table->json('snapshot_json')->nullable();
            $table->timestamps();

            $table->unique(['payroll_id', 'employee_id'], 'payroll_items_payroll_employee_unique');
        });

        Schema::create('attendance_activity_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('subject_type', 120);
            $table->unsignedBigInteger('subject_id');
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 80);
            $table->json('payload')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['subject_type', 'subject_id'], 'attendance_activity_subject_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_activity_logs');
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('overtime_requests');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('employee_shifts');

        Schema::table('shifts', function (Blueprint $table): void {
            $table->dropIndex('shifts_active_code_idx');
            $table->dropSoftDeletes();
            $table->dropColumn(['break_minutes', 'overtime_multiplier', 'friday_multiplier']);
        });
    }
};
