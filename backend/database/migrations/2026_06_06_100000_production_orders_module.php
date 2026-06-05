<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('work_orders')) {
            Schema::table('work_orders', function (Blueprint $table): void {
                if (! Schema::hasColumn('work_orders', 'order_no')) {
                    $table->string('order_no')->nullable()->unique()->after('id');
                }
                if (! Schema::hasColumn('work_orders', 'production_date')) {
                    $table->date('production_date')->nullable()->index('wo_prod_date_idx')->after('product_id');
                }
                if (! Schema::hasColumn('work_orders', 'machine_id')) {
                    $table->foreignId('machine_id')->nullable()->after('production_date')->constrained()->nullOnDelete();
                }
                if (! Schema::hasColumn('work_orders', 'mold_id')) {
                    $table->foreignId('mold_id')->nullable()->after('machine_id')->constrained()->nullOnDelete();
                }
                if (! Schema::hasColumn('work_orders', 'shift_id')) {
                    $table->foreignId('shift_id')->nullable()->after('mold_id')->constrained()->nullOnDelete();
                }
                if (! Schema::hasColumn('work_orders', 'supervisor_id')) {
                    $table->foreignId('supervisor_id')->nullable()->after('shift_id')->constrained('employees')->nullOnDelete();
                }
                if (! Schema::hasColumn('work_orders', 'production_manager_id')) {
                    $table->foreignId('production_manager_id')->nullable()->after('supervisor_id')->constrained('employees')->nullOnDelete();
                }
                if (! Schema::hasColumn('work_orders', 'planned_quantity')) {
                    $table->unsignedInteger('planned_quantity')->nullable()->after('target_quantity');
                }
                if (! Schema::hasColumn('work_orders', 'start_time')) {
                    $table->dateTime('start_time')->nullable()->after('due_date');
                }
                if (! Schema::hasColumn('work_orders', 'end_time')) {
                    $table->dateTime('end_time')->nullable()->after('start_time');
                }
                if (! Schema::hasColumn('work_orders', 'product_operation_id')) {
                    $table->foreignId('product_operation_id')->nullable()->after('end_time')->constrained('product_operations')->nullOnDelete();
                }
            });

            DB::table('work_orders')->whereNull('order_no')->update([
                'order_no' => DB::raw('code'),
            ]);
            DB::table('work_orders')->whereNull('planned_quantity')->update([
                'planned_quantity' => DB::raw('target_quantity'),
            ]);
            DB::table('work_orders')->where('status', 'planned')->update(['status' => 'draft']);
        }

        if (! Schema::hasTable('work_order_workers')) {
            Schema::create('work_order_workers', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('work_order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->string('role')->default('operator');
                $table->timestamps();
                $table->unique(['work_order_id', 'employee_id'], 'wo_worker_uq');
            });
        }

        if (! Schema::hasTable('production_logs')) {
            Schema::create('production_logs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('work_order_id')->constrained()->cascadeOnDelete();
                $table->dateTime('from_time');
                $table->dateTime('to_time');
                $table->unsignedInteger('good_quantity')->default(0);
                $table->unsignedInteger('scrap_quantity')->default(0);
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index(['work_order_id', 'from_time'], 'prod_log_wo_time_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('production_logs');
        Schema::dropIfExists('work_order_workers');

        if (Schema::hasTable('work_orders')) {
            Schema::table('work_orders', function (Blueprint $table): void {
                $cols = [
                    'product_operation_id', 'end_time', 'start_time', 'planned_quantity',
                    'production_manager_id', 'supervisor_id', 'shift_id', 'mold_id',
                    'machine_id', 'production_date', 'order_no',
                ];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('work_orders', $col)) {
                        if (in_array($col, ['machine_id', 'mold_id', 'shift_id', 'supervisor_id', 'production_manager_id', 'product_operation_id'], true)) {
                            $table->dropForeign(['work_orders_'.$col.'_foreign']);
                        }
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
