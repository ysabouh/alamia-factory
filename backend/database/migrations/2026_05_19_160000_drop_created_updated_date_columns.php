<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * إزالة أعمدة created_date / updated_date المكررة والاعتماد على created_at / updated_at.
 */
return new class extends Migration
{
    /** @return list<string> */
    private function tables(): array
    {
        return [
            'employees',
            'users',
            'machine_types',
            'machines',
            'products',
            'molds',
            'shifts',
            'work_orders',
            'machine_assignments',
            'production_entries',
            'waste_entries',
            'mold_machine_settings',
            'maintenance_tickets',
            'maintenance_actions',
            'warehouses',
            'storage_locations',
            'materials',
            'stock_levels',
            'inventory_transactions',
            'customers',
            'customer_orders',
            'customer_order_items',
            'quality_inspections',
            'quality_defects',
            'alerts',
            'material_lots',
            'work_order_material_consumption',
            'preventive_maintenance_plans',
            'preventive_maintenance_logs',
            'order_status_history',
            'activity_logs',
            'attachments',
            'halls',
            'departments',
            'job_roles',
            'employment_statuses',
            'currencies',
            'employee_shifts',
            'attendance_records',
            'overtime_requests',
        ];
    }

    public function up(): void
    {
        foreach ($this->tables() as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $hasCreatedDate = Schema::hasColumn($table, 'created_date');
            $hasUpdatedDate = Schema::hasColumn($table, 'updated_date');
            if (! $hasCreatedDate && ! $hasUpdatedDate) {
                continue;
            }

            if (! Schema::hasColumn($table, 'created_at')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->timestamp('created_at')->nullable();
                    $blueprint->timestamp('updated_at')->nullable();
                });
            }

            if ($hasCreatedDate && Schema::hasColumn($table, 'created_at')) {
                DB::table($table)
                    ->whereNull('created_at')
                    ->whereNotNull('created_date')
                    ->update(['created_at' => DB::raw('`created_date`')]);
            }

            if ($hasUpdatedDate && Schema::hasColumn($table, 'updated_at')) {
                DB::table($table)
                    ->whereNull('updated_at')
                    ->whereNotNull('updated_date')
                    ->update(['updated_at' => DB::raw('`updated_date`')]);
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table, $hasCreatedDate, $hasUpdatedDate): void {
                if ($hasCreatedDate && Schema::hasColumn($table, 'created_date')) {
                    $blueprint->dropColumn('created_date');
                }
                if ($hasUpdatedDate && Schema::hasColumn($table, 'updated_date')) {
                    $blueprint->dropColumn('updated_date');
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables() as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            Schema::table($table, function (Blueprint $blueprint) use ($table): void {
                if (! Schema::hasColumn($table, 'created_date')) {
                    $blueprint->timestamp('created_date')->nullable();
                }
                if (! Schema::hasColumn($table, 'updated_date')) {
                    $blueprint->timestamp('updated_date')->nullable();
                }
            });
            if (Schema::hasColumn($table, 'created_at') && Schema::hasColumn($table, 'created_date')) {
                DB::table($table)->whereNull('created_date')->update([
                    'created_date' => DB::raw('`created_at`'),
                    'updated_date' => DB::raw('`updated_at`'),
                ]);
            }
        }
    }
};
