<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_records', function (Blueprint $table): void {
            $table->time('overtime_from')->nullable()->after('check_out');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table): void {
            $table->dropColumn('overtime_from');
        });
    }
};
