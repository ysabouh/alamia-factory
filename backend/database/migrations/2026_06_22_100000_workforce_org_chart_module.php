<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('employees') && ! Schema::hasColumn('employees', 'reports_to_id')) {
            Schema::table('employees', function (Blueprint $table): void {
                $table->foreignId('reports_to_id')->nullable()->after('department_id')
                    ->constrained('employees')->nullOnDelete();
            });
        }

        if (Schema::hasTable('departments')) {
            Schema::table('departments', function (Blueprint $table): void {
                if (! Schema::hasColumn('departments', 'vacancy_count')) {
                    $table->unsignedInteger('vacancy_count')->default(0)->after('description');
                }
                if (! Schema::hasColumn('departments', 'manager_id')) {
                    $table->foreignId('manager_id')->nullable()->after('vacancy_count')
                        ->constrained('employees')->nullOnDelete();
                }
            });
        }

        if (! Schema::hasTable('employee_certifications')) {
            Schema::create('employee_certifications', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->string('name');
                $table->string('issuer')->nullable();
                $table->date('issued_at')->nullable();
                $table->date('expires_at')->nullable();
                $table->string('certificate_number')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_certifications');

        if (Schema::hasTable('departments')) {
            Schema::table('departments', function (Blueprint $table): void {
                if (Schema::hasColumn('departments', 'manager_id')) {
                    $table->dropConstrainedForeignId('manager_id');
                }
                if (Schema::hasColumn('departments', 'vacancy_count')) {
                    $table->dropColumn('vacancy_count');
                }
            });
        }

        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'reports_to_id')) {
            Schema::table('employees', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('reports_to_id');
            });
        }
    }
};
