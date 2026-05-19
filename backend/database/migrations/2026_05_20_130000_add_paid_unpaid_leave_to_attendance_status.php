<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE attendance_records MODIFY attendance_status ENUM(
            'present',
            'absent',
            'late',
            'leave',
            'holiday',
            'weekend',
            'remote',
            'mission',
            'paid_leave',
            'unpaid_leave'
        ) NOT NULL DEFAULT 'absent'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE attendance_records MODIFY attendance_status ENUM(
            'present',
            'absent',
            'late',
            'leave',
            'holiday',
            'weekend',
            'remote',
            'mission'
        ) NOT NULL DEFAULT 'absent'");
    }
};
