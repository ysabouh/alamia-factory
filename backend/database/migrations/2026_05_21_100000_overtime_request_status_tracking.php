<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table): void {
            $table->text('assignment_reason')->nullable()->after('reason');
        });

        Schema::create('overtime_request_status_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('overtime_request_id')->constrained('overtime_requests')->cascadeOnDelete();
            $table->string('action', 40);
            $table->string('from_status', 20)->nullable();
            $table->string('to_status', 20);
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('assignment_reason')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->text('note')->nullable();
            $table->json('changes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['overtime_request_id', 'created_at'], 'ot_status_log_request_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtime_request_status_logs');

        Schema::table('overtime_requests', function (Blueprint $table): void {
            $table->dropColumn('assignment_reason');
        });
    }
};
