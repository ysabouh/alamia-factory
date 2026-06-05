<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('machine_types')) {
            foreach ([
                ['code' => 'pe_production', 'name' => 'PE Production', 'description' => 'Polyethylene production lines'],
                ['code' => 'pe_rotational', 'name' => 'PE Rotational', 'description' => 'Rotational PE molding machines'],
                ['code' => 'pe_blow', 'name' => 'PE Blow', 'description' => 'Polyethylene blow molding machines'],
                ['code' => 'pe_extrusion', 'name' => 'PE Extrusion', 'description' => 'Polyethylene extrusion lines'],
            ] as $row) {
                DB::table('machine_types')->updateOrInsert(
                    ['code' => $row['code']],
                    [
                        'name' => $row['name'],
                        'description' => $row['description'],
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }

        if (! Schema::hasTable('polyethylene_molds')) {
            Schema::create('polyethylene_molds', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('mold_id')->unique()->constrained('molds')->cascadeOnDelete();
                $table->string('polyethylene_type')->nullable()->index();
                $table->string('production_method')->nullable()->index();
                $table->decimal('tank_volume', 12, 3)->nullable();
                $table->decimal('wall_thickness', 10, 3)->nullable();
                $table->string('cooling_method')->nullable();
                $table->string('mold_material')->nullable();
                $table->string('heating_system')->nullable();
                $table->decimal('cycle_time', 10, 2)->nullable();
                $table->decimal('pressure_rating', 10, 2)->nullable();
                $table->json('supported_products')->nullable();
                $table->decimal('max_temperature', 10, 2)->nullable();
                $table->decimal('min_temperature', 10, 2)->nullable();
                $table->unsignedSmallInteger('mold_layers')->nullable();
                $table->decimal('rotational_speed', 10, 2)->nullable();
                $table->decimal('shrinkage_rate', 8, 4)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('polyethylene_molds');
    }
};
