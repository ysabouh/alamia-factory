<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('direct_task_comments')) {
            Schema::create('direct_task_comments', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('task_id')->constrained('direct_tasks')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->text('body');
                $table->timestamps();
                $table->index(['task_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('direct_task_comments');
    }
};
