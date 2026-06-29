<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('direct_task_comments') && ! Schema::hasColumn('direct_task_comments', 'comment_type')) {
            Schema::table('direct_task_comments', function (Blueprint $table): void {
                $table->string('comment_type', 20)->default('comment')->after('body');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('direct_task_comments', 'comment_type')) {
            Schema::table('direct_task_comments', function (Blueprint $table): void {
                $table->dropColumn('comment_type');
            });
        }
    }
};
