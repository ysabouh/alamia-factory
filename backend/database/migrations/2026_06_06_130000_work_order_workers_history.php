<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('work_order_workers')) {
            return;
        }

        Schema::table('work_order_workers', function (Blueprint $table): void {
            if (! Schema::hasColumn('work_order_workers', 'effective_from')) {
                $table->dateTime('effective_from')->nullable()->after('role');
            }
            if (! Schema::hasColumn('work_order_workers', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('effective_from')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('work_order_workers', 'removed_by')) {
                $table->foreignId('removed_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('work_order_workers', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('work_order_workers')) {
            return;
        }

        Schema::table('work_order_workers', function (Blueprint $table): void {
            if (Schema::hasColumn('work_order_workers', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
            if (Schema::hasColumn('work_order_workers', 'removed_by')) {
                $table->dropConstrainedForeignId('removed_by');
            }
            if (Schema::hasColumn('work_order_workers', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
            if (Schema::hasColumn('work_order_workers', 'effective_from')) {
                $table->dropColumn('effective_from');
            }
        });
    }
};
