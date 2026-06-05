<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('downtime_reasons')) {
            Schema::create('downtime_reasons', function (Blueprint $table): void {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });

            $now = now();
            $reasons = [
                ['machine_breakdown', 'Machine Breakdown'],
                ['mold_issue', 'Mold Issue'],
                ['material_shortage', 'Material Shortage'],
                ['power_failure', 'Power Failure'],
                ['quality_issue', 'Quality Issue'],
                ['maintenance', 'Maintenance'],
                ['other', 'Other'],
            ];

            foreach ($reasons as [$code, $name]) {
                DB::table('downtime_reasons')->insert([
                    'code' => $code,
                    'name' => $name,
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        if (! Schema::hasTable('machine_downtimes')) {
            Schema::create('machine_downtimes', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('work_order_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('machine_id')->constrained()->cascadeOnDelete();
                $table->dateTime('start_time');
                $table->dateTime('end_time')->nullable();
                $table->unsignedInteger('downtime_minutes')->nullable();
                $table->foreignId('downtime_reason_id')->nullable()->constrained('downtime_reasons')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index(['machine_id', 'start_time'], 'md_machine_time_idx');
            });
        }

        if (Schema::hasTable('maintenance_tickets')) {
            Schema::table('maintenance_tickets', function (Blueprint $table): void {
                if (! Schema::hasColumn('maintenance_tickets', 'work_order_id')) {
                    $table->foreignId('work_order_id')->nullable()->after('machine_id')->constrained()->nullOnDelete();
                }
                if (! Schema::hasColumn('maintenance_tickets', 'machine_downtime_id')) {
                    $table->foreignId('machine_downtime_id')->nullable()->after('work_order_id')->constrained('machine_downtimes')->nullOnDelete();
                }
                if (! Schema::hasColumn('maintenance_tickets', 'request_no')) {
                    $table->string('request_no')->nullable()->unique()->after('id');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('maintenance_tickets')) {
            Schema::table('maintenance_tickets', function (Blueprint $table): void {
                foreach (['machine_downtime_id', 'work_order_id', 'request_no'] as $col) {
                    if (Schema::hasColumn('maintenance_tickets', $col)) {
                        if (in_array($col, ['machine_downtime_id', 'work_order_id'], true)) {
                            $table->dropForeign(['maintenance_tickets_'.$col.'_foreign']);
                        }
                        $table->dropColumn($col);
                    }
                }
            });
        }

        Schema::dropIfExists('machine_downtimes');
        Schema::dropIfExists('downtime_reasons');
    }
};
