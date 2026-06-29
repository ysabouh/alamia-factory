<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('machines') && ! Schema::hasColumn('machines', 'image_url')) {
            Schema::table('machines', function (Blueprint $table): void {
                $table->string('image_url')->nullable()->after('notes');
            });
        }

        if (! Schema::hasTable('machine_images')) {
            Schema::create('machine_images', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('machine_id')->constrained('machines')->cascadeOnDelete();
                $table->string('image_url');
                $table->boolean('is_primary')->default(false);
                $table->timestamp('uploaded_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('machine_images');

        if (Schema::hasTable('machines') && Schema::hasColumn('machines', 'image_url')) {
            Schema::table('machines', function (Blueprint $table): void {
                $table->dropColumn('image_url');
            });
        }
    }
};
