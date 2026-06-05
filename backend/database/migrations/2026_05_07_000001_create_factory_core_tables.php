<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('employee_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table): void {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('guard_name')->default('web');
            $table->timestamps();
            $table->unique(['name', 'guard_name']);
        });

        Schema::create('permissions', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('guard_name')->default('web');
            $table->timestamps();
            $table->unique(['name', 'guard_name']);
        });

        Schema::create('model_has_roles', function (Blueprint $table): void {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->morphs('model');
            $table->primary(['role_id', 'model_id', 'model_type']);
        });

        Schema::create('role_has_permissions', function (Blueprint $table): void {
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['permission_id', 'role_id']);
        });

        Schema::create('machine_types', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('machines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('machine_type_id')->constrained();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('capacity')->nullable();
            $table->string('location')->nullable();
            $table->string('status')->index()->default('idle');
            $table->text('status_note')->nullable();
            $table->timestamp('last_status_changed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('unit')->default('piece');
            $table->decimal('standard_weight_grams', 12, 3)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('molds', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained();
            $table->string('code')->unique();
            $table->string('name');
            $table->unsignedInteger('cavity_count')->default(1);
            $table->unsignedInteger('default_cycle_seconds')->nullable();
            $table->decimal('expected_piece_weight_grams', 12, 3)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('shifts', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->time('starts_at');
            $table->time('ends_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('work_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained();
            $table->string('code')->unique();
            $table->unsignedInteger('target_quantity');
            $table->string('priority')->default('normal');
            $table->string('status')->index()->default('planned');
            $table->date('due_date')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('machine_assignments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('machine_id')->constrained();
            $table->foreignId('mold_id')->constrained();
            $table->foreignId('work_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('operator_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->timestamp('started_at')->index();
            $table->timestamp('ended_at')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('production_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('machine_id')->constrained();
            $table->foreignId('mold_id')->constrained();
            $table->foreignId('work_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('shift_id')->constrained();
            $table->date('entry_date')->index();
            $table->unsignedInteger('produced_pieces');
            $table->decimal('produced_weight_kg', 12, 3)->nullable();
            $table->decimal('piece_weight_grams', 12, 3)->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['machine_id', 'mold_id', 'shift_id']);
        });

        Schema::create('waste_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('machine_id')->constrained();
            $table->foreignId('mold_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('work_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('shift_id')->constrained();
            $table->date('entry_date')->index();
            $table->unsignedInteger('quantity')->nullable();
            $table->decimal('weight_kg', 12, 3)->nullable();
            $table->string('reason')->index();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['machine_id', 'reason']);
        });

        Schema::create('mold_machine_settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('machine_id')->constrained();
            $table->foreignId('mold_id')->constrained();
            $table->date('effective_date')->index();
            $table->unsignedInteger('cycle_seconds')->nullable();
            $table->json('temperature_zones')->nullable();
            $table->decimal('pressure_bar', 10, 2)->nullable();
            $table->unsignedInteger('cooling_seconds')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('maintenance_tickets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('machine_id')->constrained();
            $table->foreignId('reported_by_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('assigned_technician_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->string('severity')->index()->default('medium');
            $table->string('status')->index()->default('open');
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamp('downtime_started_at')->nullable();
            $table->timestamp('downtime_ended_at')->nullable();
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['machine_id', 'status']);
        });

        Schema::create('maintenance_actions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('maintenance_ticket_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->text('action_taken');
            $table->json('parts_used')->nullable();
            $table->unsignedInteger('time_spent_minutes')->nullable();
            $table->timestamps();
        });

        Schema::create('warehouses', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('type')->default('general');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('storage_locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('warehouse_id')->constrained();
            $table->string('code');
            $table->string('name');
            $table->timestamps();
            $table->unique(['warehouse_id', 'code']);
        });

        Schema::create('materials', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('category')->nullable();
            $table->string('unit')->default('kg');
            $table->decimal('minimum_stock', 12, 3)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('stock_levels', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('warehouse_id')->constrained();
            $table->foreignId('storage_location_id')->nullable()->constrained()->nullOnDelete();
            $table->morphs('item');
            $table->decimal('quantity', 14, 3)->default(0);
            $table->string('unit');
            $table->timestamps();
            $table->unique(['warehouse_id', 'storage_location_id', 'item_type', 'item_id'], 'stock_unique_location_item');
        });

        Schema::create('inventory_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('warehouse_id')->constrained();
            $table->foreignId('storage_location_id')->nullable()->constrained()->nullOnDelete();
            $table->morphs('item');
            $table->string('transaction_type')->index();
            $table->decimal('quantity', 14, 3);
            $table->string('unit');
            $table->nullableMorphs('reference');
            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['item_type', 'item_id', 'warehouse_id']);
        });

        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('customer_orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained();
            $table->string('code')->unique();
            $table->string('status')->index()->default('draft');
            $table->date('ordered_at');
            $table->date('due_date')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('customer_order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->decimal('quantity', 14, 3);
            $table->decimal('unit_price', 14, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('quality_inspections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('production_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('inspector_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->string('result')->index();
            $table->unsignedInteger('sample_size')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('quality_defects', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('quality_inspection_id')->constrained()->cascadeOnDelete();
            $table->string('defect_type');
            $table->unsignedInteger('quantity')->default(1);
            $table->string('severity')->default('minor');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('alerts', function (Blueprint $table): void {
            $table->id();
            $table->nullableMorphs('alertable');
            $table->string('severity')->index();
            $table->string('message');
            $table->timestamp('resolved_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach ([
            'alerts',
            'quality_defects',
            'quality_inspections',
            'customer_order_items',
            'customer_orders',
            'customers',
            'inventory_transactions',
            'stock_levels',
            'materials',
            'storage_locations',
            'warehouses',
            'maintenance_actions',
            'maintenance_tickets',
            'mold_machine_settings',
            'waste_entries',
            'production_entries',
            'machine_assignments',
            'work_orders',
            'shifts',
            'molds',
            'products',
            'machines',
            'machine_types',
            'role_has_permissions',
            'model_has_roles',
            'permissions',
            'roles',
            'password_reset_tokens',
            'users',
            'employees',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
