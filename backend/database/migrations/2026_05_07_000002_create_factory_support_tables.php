<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_lots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('material_id')->constrained();
            $table->string('lot_code');
            $table->string('supplier_name')->nullable();
            $table->date('received_at')->nullable();
            $table->date('expires_at')->nullable();
            $table->string('quality_status')->default('pending');
            $table->timestamps();
            $table->unique(['material_id', 'lot_code']);
        });

        Schema::create('work_order_material_consumption', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('work_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('material_id')->constrained();
            $table->decimal('planned_quantity', 14, 3)->default(0);
            $table->decimal('actual_quantity', 14, 3)->default(0);
            $table->string('unit')->default('kg');
            $table->timestamps();
        });

        Schema::create('preventive_maintenance_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('machine_id')->constrained();
            $table->string('name');
            $table->string('interval_unit')->default('days');
            $table->unsignedInteger('interval_value');
            $table->json('checklist')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('preventive_maintenance_logs', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('preventive_maintenance_plan_id');
            $table->foreign('preventive_maintenance_plan_id', 'pm_logs_plan_id_foreign')
                ->references('id')
                ->on('preventive_maintenance_plans')
                ->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->timestamp('performed_at');
            $table->json('checklist_result')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('order_status_history', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_order_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->foreignId('changed_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->nullableMorphs('subject');
            $table->string('event');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamps();
        });

        Schema::create('attachments', function (Blueprint $table): void {
            $table->id();
            $table->morphs('attachable');
            $table->string('disk')->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size')->nullable();
            $table->foreignId('uploaded_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach ([
            'attachments',
            'activity_logs',
            'order_status_history',
            'preventive_maintenance_logs',
            'preventive_maintenance_plans',
            'work_order_material_consumption',
            'material_lots',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
