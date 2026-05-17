<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('job_roles') && ! Schema::hasColumn('job_roles', 'is_active')) {
            Schema::table('job_roles', function (Blueprint $table): void {
                $table->boolean('is_active')->default(true)->after('description');
                $table->index('is_active', 'job_roles_is_active_idx');
            });
        }

        if (Schema::hasTable('shifts') && ! Schema::hasColumn('shifts', 'description')) {
            Schema::table('shifts', function (Blueprint $table): void {
                $table->text('description')->nullable()->after('ends_at');
            });
        }

        foreach (['halls', 'departments', 'shifts'] as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'is_active')) {
                continue;
            }
            $index = "{$table}_is_active_idx";
            if (! $this->indexExists($table, $index)) {
                Schema::table($table, function (Blueprint $blueprint) use ($index): void {
                    $blueprint->index('is_active', $index);
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('job_roles') && Schema::hasColumn('job_roles', 'is_active')) {
            Schema::table('job_roles', function (Blueprint $table): void {
                $table->dropIndex('job_roles_is_active_idx');
                $table->dropColumn('is_active');
            });
        }

        if (Schema::hasTable('shifts') && Schema::hasColumn('shifts', 'description')) {
            Schema::table('shifts', function (Blueprint $table): void {
                $table->dropColumn('description');
            });
        }

        foreach (['halls', 'departments', 'shifts'] as $table) {
            $index = "{$table}_is_active_idx";
            if (Schema::hasTable($table) && $this->indexExists($table, $index)) {
                Schema::table($table, function (Blueprint $blueprint) use ($index): void {
                    $blueprint->dropIndex($index);
                });
            }
        }
    }

    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $db = $connection->getDatabaseName();

        $row = $connection->selectOne(
            'SELECT COUNT(*) AS c FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
            [$db, $table, $index]
        );

        return (int) ($row->c ?? 0) > 0;
    }
};
