<?php

use App\Domain\Factory\Models\EmploymentStatus;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        EmploymentStatus::query()->firstOrCreate(
            ['code' => 'LATE'],
            ['name' => 'متأخر']
        );
    }

    public function down(): void
    {
        EmploymentStatus::query()->where('code', 'LATE')->delete();
    }
};
