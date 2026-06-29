<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('machine_downtime_photos')) {
            Schema::create('machine_downtime_photos', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('machine_downtime_id')->constrained()->cascadeOnDelete();
                $table->string('file_path');
                $table->string('file_name')->nullable();
                $table->timestamp('uploaded_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('machine_downtime_photos');
    }
};
