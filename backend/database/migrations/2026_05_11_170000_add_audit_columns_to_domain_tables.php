<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * أعمدة تدقيق موحّدة على جداول النطاق (بدون جداول Laravel/Spatie الداخلية).
 */
return new class extends Migration
{
    /** @return list<string> */
    private function domainTables(): array
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
        ];
    }

    public function up(): void
    {
        foreach ([
            'production_entries',
            'waste_entries',
            'maintenance_tickets',
            'inventory_transactions',
        ] as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'created_by_id')) {
                continue;
            }
            if (Schema::hasColumn($table, 'created_by')) {
                continue;
            }
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->dropForeign(['created_by_id']);
            });
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->renameColumn('created_by_id', 'created_by');
            });
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            });
        }

        foreach ($this->domainTables() as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            Schema::table($table, function (Blueprint $blueprint) use ($table): void {
                if (! Schema::hasColumn($table, 'created_by')) {
                    $blueprint->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                }
                if (! Schema::hasColumn($table, 'updated_by')) {
                    $blueprint->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        $renameBack = [
            'production_entries',
            'waste_entries',
            'maintenance_tickets',
            'inventory_transactions',
        ];

        foreach ($this->domainTables() as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            Schema::table($table, function (Blueprint $blueprint) use ($table): void {
                if (Schema::hasColumn($table, 'updated_by')) {
                    $blueprint->dropForeign(['updated_by']);
                }
                if (Schema::hasColumn($table, 'created_by')) {
                    $blueprint->dropForeign(['created_by']);
                }
                foreach (['updated_by'] as $col) {
                    if (Schema::hasColumn($table, $col)) {
                        $blueprint->dropColumn($col);
                    }
                }
            });
        }

        foreach ($this->domainTables() as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            if (in_array($table, $renameBack, true)) {
                continue;
            }
            if (Schema::hasColumn($table, 'created_by')) {
                Schema::table($table, function (Blueprint $blueprint): void {
                    $blueprint->dropColumn('created_by');
                });
            }
        }

        foreach ($renameBack as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'created_by')) {
                continue;
            }
            if (Schema::hasColumn($table, 'created_by_id')) {
                continue;
            }
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->renameColumn('created_by', 'created_by_id');
            });
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->foreign('created_by_id')->references('id')->on('users')->nullOnDelete();
            });
        }
    }
};
