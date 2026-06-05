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
            DB::table('machine_types')->updateOrInsert(
                ['code' => 'compression'],
                ['name' => 'Compression', 'description' => 'Compression molding machines', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]
            );
        }

        if (Schema::hasTable('molds')) {
            Schema::table('molds', function (Blueprint $table): void {
                if (! Schema::hasColumn('molds', 'mold_type')) {
                    $table->string('mold_type')->default('injection')->index()->after('name');
                }
                if (! Schema::hasColumn('molds', 'status')) {
                    $table->string('status')->default('active')->index()->after('mold_type');
                }
                if (! Schema::hasColumn('molds', 'product_name')) {
                    $table->string('product_name')->nullable()->after('cavity_count');
                }
                if (! Schema::hasColumn('molds', 'material_type')) {
                    $table->string('material_type')->nullable()->after('product_name');
                }
                if (! Schema::hasColumn('molds', 'machine_id')) {
                    $table->foreignId('machine_id')->nullable()->after('material_type')->constrained('machines')->nullOnDelete();
                }
                if (! Schema::hasColumn('molds', 'manufacturer')) {
                    $table->string('manufacturer')->nullable()->after('machine_id');
                }
                if (! Schema::hasColumn('molds', 'manufacturing_country')) {
                    $table->string('manufacturing_country')->nullable()->after('manufacturer');
                }
                if (! Schema::hasColumn('molds', 'manufacturing_date')) {
                    $table->date('manufacturing_date')->nullable()->after('manufacturing_country');
                }
                if (! Schema::hasColumn('molds', 'purchase_date')) {
                    $table->date('purchase_date')->nullable()->after('manufacturing_date');
                }
                if (! Schema::hasColumn('molds', 'purchase_cost')) {
                    $table->decimal('purchase_cost', 14, 2)->nullable()->after('purchase_date');
                }
                if (! Schema::hasColumn('molds', 'mold_weight')) {
                    $table->decimal('mold_weight', 12, 3)->nullable()->after('purchase_cost');
                }
                if (! Schema::hasColumn('molds', 'mold_dimensions')) {
                    $table->string('mold_dimensions')->nullable()->after('mold_weight');
                }
                if (! Schema::hasColumn('molds', 'expected_life_cycles')) {
                    $table->unsignedBigInteger('expected_life_cycles')->nullable()->after('mold_dimensions');
                }
                if (! Schema::hasColumn('molds', 'total_cycles')) {
                    $table->unsignedBigInteger('total_cycles')->default(0)->after('expected_life_cycles');
                }
                if (! Schema::hasColumn('molds', 'current_location')) {
                    $table->string('current_location')->nullable()->after('total_cycles');
                }
                if (! Schema::hasColumn('molds', 'maintenance_cycle')) {
                    $table->unsignedInteger('maintenance_cycle')->nullable()->after('current_location');
                }
                if (! Schema::hasColumn('molds', 'last_maintenance_date')) {
                    $table->date('last_maintenance_date')->nullable()->after('maintenance_cycle');
                }
                if (! Schema::hasColumn('molds', 'next_maintenance_date')) {
                    $table->date('next_maintenance_date')->nullable()->after('last_maintenance_date');
                }
                if (! Schema::hasColumn('molds', 'image_url')) {
                    $table->string('image_url')->nullable()->after('next_maintenance_date');
                }
                if (! Schema::hasColumn('molds', 'notes')) {
                    $table->text('notes')->nullable()->after('image_url');
                }
                if (! Schema::hasColumn('molds', 'deleted_at')) {
                    $table->softDeletes();
                }
            });

            DB::table('molds')->whereNull('mold_type')->update(['mold_type' => 'injection']);
            DB::table('molds')->whereNull('status')->update(['status' => 'active']);
        }

        if (! Schema::hasTable('injection_molds')) {
            Schema::create('injection_molds', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('mold_id')->unique()->constrained('molds')->cascadeOnDelete();
                $table->boolean('hot_runner')->default(false);
                $table->string('runner_type')->nullable();
                $table->string('gate_type')->nullable();
                $table->unsignedSmallInteger('cooling_circuit_count')->nullable();
                $table->string('ejector_system_type')->nullable();
                $table->decimal('max_injection_pressure', 10, 2)->nullable();
                $table->decimal('clamp_force_required', 10, 2)->nullable();
                $table->decimal('cycle_time', 10, 2)->nullable();
                $table->string('mold_steel_type')->nullable();
                $table->decimal('shrinkage_rate', 8, 4)->nullable();
                $table->unsignedSmallInteger('core_pull_count')->nullable();
                $table->string('texture_type')->nullable();
                $table->json('supported_materials')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('pet_blow_molds')) {
            Schema::create('pet_blow_molds', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('mold_id')->unique()->constrained('molds')->cascadeOnDelete();
                $table->string('blow_type')->nullable();
                $table->unsignedInteger('bottle_volume_ml')->nullable();
                $table->decimal('neck_diameter', 10, 2)->nullable();
                $table->string('cooling_method')->nullable();
                $table->decimal('air_pressure_required', 10, 2)->nullable();
                $table->decimal('blow_ratio', 8, 3)->nullable();
                $table->string('parison_type')->nullable();
                $table->decimal('cooling_time', 10, 2)->nullable();
                $table->string('mold_material')->nullable();
                $table->json('supported_polymers')->nullable();
                $table->decimal('max_temperature', 10, 2)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('compression_molds')) {
            Schema::create('compression_molds', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('mold_id')->unique()->constrained('molds')->cascadeOnDelete();
                $table->decimal('compression_force', 12, 2)->nullable();
                $table->string('heating_type')->nullable();
                $table->decimal('mold_temperature', 10, 2)->nullable();
                $table->decimal('pressure_time', 10, 2)->nullable();
                $table->decimal('curing_time', 10, 2)->nullable();
                $table->string('mold_material')->nullable();
                $table->unsignedSmallInteger('heating_zones')->nullable();
                $table->json('supported_materials')->nullable();
                $table->decimal('max_product_thickness', 10, 2)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('mold_images')) {
            Schema::create('mold_images', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('mold_id')->constrained('molds')->cascadeOnDelete();
                $table->string('image_url');
                $table->string('image_type')->nullable();
                $table->boolean('is_primary')->default(false);
                $table->timestamp('uploaded_at')->useCurrent();
                $table->timestamps();
                $table->index(['mold_id', 'is_primary']);
            });
        }

        if (! Schema::hasTable('mold_maintenance_logs')) {
            Schema::create('mold_maintenance_logs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('mold_id')->constrained('molds')->cascadeOnDelete();
                $table->string('maintenance_type');
                $table->text('description')->nullable();
                $table->string('technician')->nullable();
                $table->date('maintenance_date');
                $table->decimal('cost', 12, 2)->nullable();
                $table->date('next_maintenance_date')->nullable();
                $table->timestamps();
                $table->index(['mold_id', 'maintenance_date']);
            });
        }

        if (! Schema::hasTable('mold_installations')) {
            Schema::create('mold_installations', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('mold_id')->constrained('molds')->cascadeOnDelete();
                $table->foreignId('machine_id')->constrained('machines')->cascadeOnDelete();
                $table->timestamp('installed_at');
                $table->timestamp('removed_at')->nullable();
                $table->foreignId('installed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->index(['mold_id', 'installed_at']);
                $table->index(['machine_id', 'installed_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('mold_installations');
        Schema::dropIfExists('mold_maintenance_logs');
        Schema::dropIfExists('mold_images');
        Schema::dropIfExists('compression_molds');
        Schema::dropIfExists('pet_blow_molds');
        Schema::dropIfExists('injection_molds');

        if (Schema::hasTable('molds')) {
            Schema::table('molds', function (Blueprint $table): void {
                foreach ([
                    'deleted_at', 'notes', 'image_url', 'next_maintenance_date', 'last_maintenance_date',
                    'maintenance_cycle', 'current_location', 'total_cycles', 'expected_life_cycles',
                    'mold_dimensions', 'mold_weight', 'purchase_cost', 'purchase_date', 'manufacturing_date',
                    'manufacturing_country', 'manufacturer', 'machine_id', 'material_type', 'product_name',
                    'status', 'mold_type',
                ] as $col) {
                    if (Schema::hasColumn('molds', $col)) {
                        if ($col === 'machine_id') {
                            $table->dropForeign(['machine_id']);
                        }
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
