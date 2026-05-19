<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['overtime_hour_rate', 'overtime_friday_hour_rate']);
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->decimal('overtime_hour_rate', 10, 2)->default(0)->after('basic_salary');
            $table->decimal('overtime_friday_hour_rate', 10, 2)->default(0)->after('overtime_hour_rate');
        });
    }
};
