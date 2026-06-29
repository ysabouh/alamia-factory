<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('machine_downtimes')) {
            Schema::table('machine_downtimes', function (Blueprint $table): void {
                if (! Schema::hasColumn('machine_downtimes', 'fault_description')) {
                    $table->text('fault_description')->nullable()->after('notes');
                }
                if (! Schema::hasColumn('machine_downtimes', 'repair_method')) {
                    $table->text('repair_method')->nullable()->after('fault_description');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('machine_downtimes')) {
            Schema::table('machine_downtimes', function (Blueprint $table): void {
                foreach (['repair_method', 'fault_description'] as $col) {
                    if (Schema::hasColumn('machine_downtimes', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
