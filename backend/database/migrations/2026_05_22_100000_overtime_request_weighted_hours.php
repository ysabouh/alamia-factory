<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table): void {
            $table->decimal('duration_hours', 6, 2)->default(0)->after('end_time');
            $table->decimal('weighted_hours', 6, 2)->default(0)->after('duration_hours');
            $table->decimal('rate_multiplier', 4, 2)->nullable()->after('weighted_hours');
        });
    }

    public function down(): void
    {
        Schema::table('overtime_requests', function (Blueprint $table): void {
            $table->dropColumn(['duration_hours', 'weighted_hours', 'rate_multiplier']);
        });
    }
};
