<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Industrial ERP product master — normalized schema for plastic manufacturing.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('units')) {
            Schema::create('units', function (Blueprint $table): void {
                $table->id();
                $table->string('unit_code')->unique();
                $table->string('unit_name_ar');
                $table->string('unit_name_en')->nullable();
                $table->string('symbol', 16)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_categories')) {
            Schema::create('product_categories', function (Blueprint $table): void {
                $table->id();
                $table->string('category_code')->unique();
                $table->string('category_name_ar');
                $table->string('category_name_en')->nullable();
                $table->foreignId('parent_id')->nullable()->constrained('product_categories')->nullOnDelete();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('plastic_materials')) {
            Schema::create('plastic_materials', function (Blueprint $table): void {
                $table->id();
                $table->string('material_code')->unique();
                $table->string('material_name');
                $table->decimal('density', 8, 4)->nullable();
                $table->unsignedSmallInteger('melt_temperature')->nullable();
                $table->unsignedSmallInteger('drying_temperature')->nullable();
                $table->text('notes')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_colors')) {
            Schema::create('product_colors', function (Blueprint $table): void {
                $table->id();
                $table->string('color_code')->unique();
                $table->string('color_name');
                $table->string('hex_color', 7)->nullable();
                $table->string('masterbatch_reference')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table): void {
                if (! Schema::hasColumn('products', 'product_code')) {
                    $table->string('product_code')->nullable()->unique()->after('id');
                }
                if (! Schema::hasColumn('products', 'sku')) {
                    $table->string('sku')->nullable()->unique()->after('product_code');
                }
                if (! Schema::hasColumn('products', 'barcode')) {
                    $table->string('barcode')->nullable()->index()->after('sku');
                }
                if (! Schema::hasColumn('products', 'product_name_ar')) {
                    $table->string('product_name_ar')->nullable()->after('barcode');
                }
                if (! Schema::hasColumn('products', 'product_name_en')) {
                    $table->string('product_name_en')->nullable()->after('product_name_ar');
                }
                if (! Schema::hasColumn('products', 'short_name')) {
                    $table->string('short_name')->nullable()->after('product_name_en');
                }
                if (! Schema::hasColumn('products', 'category_id')) {
                    $table->foreignId('category_id')->nullable()->after('short_name')->constrained('product_categories')->nullOnDelete();
                }
                if (! Schema::hasColumn('products', 'product_type')) {
                    $table->string('product_type')->default('finished_good')->index()->after('category_id');
                }
                if (! Schema::hasColumn('products', 'manufacturing_type')) {
                    $table->string('manufacturing_type')->nullable()->index()->after('product_type');
                }
                if (! Schema::hasColumn('products', 'plastic_material_id')) {
                    $table->foreignId('plastic_material_id')->nullable()->after('manufacturing_type')->constrained('plastic_materials')->nullOnDelete();
                }
                if (! Schema::hasColumn('products', 'color_id')) {
                    $table->foreignId('color_id')->nullable()->after('plastic_material_id')->constrained('product_colors')->nullOnDelete();
                }
                if (! Schema::hasColumn('products', 'unit_id')) {
                    $table->foreignId('unit_id')->nullable()->after('color_id')->constrained('units')->nullOnDelete();
                }
                if (! Schema::hasColumn('products', 'product_weight')) {
                    $table->decimal('product_weight', 12, 3)->nullable()->after('unit_id');
                }
                if (! Schema::hasColumn('products', 'product_volume')) {
                    $table->decimal('product_volume', 12, 3)->nullable()->after('product_weight');
                }
                if (! Schema::hasColumn('products', 'dimensions')) {
                    $table->string('dimensions')->nullable()->after('product_volume');
                }
                if (! Schema::hasColumn('products', 'cavity_output')) {
                    $table->unsignedInteger('cavity_output')->nullable()->after('dimensions');
                }
                if (! Schema::hasColumn('products', 'standard_cycle_time')) {
                    $table->unsignedInteger('standard_cycle_time')->nullable()->after('cavity_output');
                }
                if (! Schema::hasColumn('products', 'target_output_per_hour')) {
                    $table->unsignedInteger('target_output_per_hour')->nullable()->after('standard_cycle_time');
                }
                if (! Schema::hasColumn('products', 'product_status')) {
                    $table->string('product_status')->default('active')->index()->after('target_output_per_hour');
                }
                if (! Schema::hasColumn('products', 'image_url')) {
                    $table->string('image_url')->nullable()->after('product_status');
                }
                if (! Schema::hasColumn('products', 'technical_notes')) {
                    $table->text('technical_notes')->nullable()->after('image_url');
                }
                if (! Schema::hasColumn('products', 'tenant_id')) {
                    $table->unsignedBigInteger('tenant_id')->nullable()->index()->after('is_active');
                }
                if (! Schema::hasColumn('products', 'factory_id')) {
                    $table->unsignedBigInteger('factory_id')->nullable()->index()->after('tenant_id');
                }
                if (! Schema::hasColumn('products', 'branch_id')) {
                    $table->unsignedBigInteger('branch_id')->nullable()->index()->after('factory_id');
                }
            });

            if (Schema::hasColumn('products', 'code')) {
                DB::table('products')->whereNull('product_code')->update([
                    'product_code' => DB::raw('`code`'),
                    'sku' => DB::raw('COALESCE(`sku`, `code`)'),
                    'product_name_ar' => DB::raw('COALESCE(`product_name_ar`, `name`)'),
                ]);
            }
        }

        if (! Schema::hasTable('product_images')) {
            Schema::create('product_images', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->string('image_url');
                $table->string('image_type')->default('main')->index();
                $table->boolean('is_primary')->default(false);
                $table->timestamp('uploaded_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_documents')) {
            Schema::create('product_documents', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->string('document_name');
                $table->string('document_type')->index();
                $table->string('file_url');
                $table->timestamp('uploaded_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_bom')) {
            Schema::create('product_bom', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->foreignId('material_product_id')->constrained('products')->cascadeOnDelete();
                $table->decimal('quantity', 14, 4);
                $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
                $table->decimal('waste_percentage', 5, 2)->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->unique(['product_id', 'material_product_id']);
            });
        }

        if (! Schema::hasTable('product_quality_specs')) {
            Schema::create('product_quality_specs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->unique()->constrained()->cascadeOnDelete();
                $table->decimal('weight_tolerance', 8, 3)->nullable();
                $table->decimal('thickness_tolerance', 8, 3)->nullable();
                $table->decimal('color_tolerance', 8, 3)->nullable();
                $table->boolean('pressure_test_required')->default(false);
                $table->boolean('leak_test_required')->default(false);
                $table->boolean('drop_test_required')->default(false);
                $table->boolean('visual_inspection_required')->default(true);
                $table->text('qc_notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_molds')) {
            Schema::create('product_molds', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->foreignId('mold_id')->constrained()->cascadeOnDelete();
                $table->unsignedTinyInteger('priority')->default(1);
                $table->boolean('is_default')->default(false);
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->unique(['product_id', 'mold_id']);
            });
        }

        if (Schema::hasTable('molds') && Schema::hasTable('product_molds')) {
            $existing = DB::table('product_molds')->pluck('mold_id')->all();
            $rows = DB::table('molds')
                ->whereNotNull('product_id')
                ->whereNotIn('id', $existing)
                ->get();
            foreach ($rows as $mold) {
                DB::table('product_molds')->insert([
                    'product_id' => $mold->product_id,
                    'mold_id' => $mold->id,
                    'priority' => 1,
                    'is_default' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        if (! Schema::hasTable('product_machine_settings')) {
            Schema::create('product_machine_settings', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->foreignId('machine_id')->constrained()->cascadeOnDelete();
                $table->unsignedInteger('cycle_time')->nullable();
                $table->decimal('injection_pressure', 10, 2)->nullable();
                $table->decimal('holding_pressure', 10, 2)->nullable();
                $table->unsignedInteger('cooling_time')->nullable();
                $table->decimal('mold_temperature', 8, 2)->nullable();
                $table->json('barrel_temperature_profile')->nullable();
                $table->decimal('shot_weight', 10, 3)->nullable();
                $table->decimal('clamp_force', 12, 2)->nullable();
                $table->decimal('back_pressure', 10, 2)->nullable();
                $table->unsignedInteger('screw_speed')->nullable();
                $table->text('setup_notes')->nullable();
                $table->timestamps();
                $table->unique(['product_id', 'machine_id']);
            });
        }

        if (! Schema::hasTable('work_order_product_snapshots')) {
            Schema::create('work_order_product_snapshots', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('work_order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->json('snapshot_data');
                $table->timestamp('captured_at');
                $table->timestamps();
            });
        }

        $this->seedReferenceData();
    }

    private function seedReferenceData(): void
    {
        $now = now();

        foreach ([
            ['unit_code' => 'piece', 'unit_name_ar' => 'قطعة', 'unit_name_en' => 'Piece', 'symbol' => 'pc'],
            ['unit_code' => 'kg', 'unit_name_ar' => 'كيلوغرام', 'unit_name_en' => 'Kilogram', 'symbol' => 'kg'],
            ['unit_code' => 'g', 'unit_name_ar' => 'غرام', 'unit_name_en' => 'Gram', 'symbol' => 'g'],
            ['unit_code' => 'liter', 'unit_name_ar' => 'لتر', 'unit_name_en' => 'Liter', 'symbol' => 'L'],
        ] as $unit) {
            DB::table('units')->updateOrInsert(
                ['unit_code' => $unit['unit_code']],
                array_merge($unit, ['is_active' => true, 'created_at' => $now, 'updated_at' => $now])
            );
        }

        foreach ([
            ['category_code' => 'FG-INJ', 'category_name_ar' => 'منتجات حقن', 'category_name_en' => 'Injection Products'],
            ['category_code' => 'FG-PET', 'category_name_ar' => 'منتجات PET', 'category_name_en' => 'PET Products'],
            ['category_code' => 'FG-CMP', 'category_name_ar' => 'منتجات ضغط', 'category_name_en' => 'Compression Products'],
            ['category_code' => 'FG-PE', 'category_name_ar' => 'منتجات بولي إيثيلين', 'category_name_en' => 'Polyethylene Products'],
        ] as $cat) {
            DB::table('product_categories')->updateOrInsert(
                ['category_code' => $cat['category_code']],
                array_merge($cat, ['is_active' => true, 'created_at' => $now, 'updated_at' => $now])
            );
        }

        foreach ([
            ['material_code' => 'PET', 'material_name' => 'Polyethylene Terephthalate', 'density' => 1.38, 'melt_temperature' => 280],
            ['material_code' => 'HDPE', 'material_name' => 'High-Density Polyethylene', 'density' => 0.97, 'melt_temperature' => 220],
            ['material_code' => 'LDPE', 'material_name' => 'Low-Density Polyethylene', 'density' => 0.92, 'melt_temperature' => 200],
            ['material_code' => 'PP', 'material_name' => 'Polypropylene', 'density' => 0.90, 'melt_temperature' => 230],
            ['material_code' => 'PVC', 'material_name' => 'Polyvinyl Chloride', 'density' => 1.35, 'melt_temperature' => 190],
            ['material_code' => 'ABS', 'material_name' => 'Acrylonitrile Butadiene Styrene', 'density' => 1.05, 'melt_temperature' => 240],
        ] as $mat) {
            DB::table('plastic_materials')->updateOrInsert(
                ['material_code' => $mat['material_code']],
                array_merge($mat, ['is_active' => true, 'created_at' => $now, 'updated_at' => $now])
            );
        }

        foreach ([
            ['color_code' => 'NAT', 'color_name' => 'Natural', 'hex_color' => '#F5F5DC'],
            ['color_code' => 'WHT', 'color_name' => 'White', 'hex_color' => '#FFFFFF'],
            ['color_code' => 'BLK', 'color_name' => 'Black', 'hex_color' => '#000000'],
            ['color_code' => 'BLU', 'color_name' => 'Blue', 'hex_color' => '#0066CC'],
        ] as $color) {
            DB::table('product_colors')->updateOrInsert(
                ['color_code' => $color['color_code']],
                array_merge($color, ['is_active' => true, 'created_at' => $now, 'updated_at' => $now])
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('work_order_product_snapshots');
        Schema::dropIfExists('product_machine_settings');
        Schema::dropIfExists('product_molds');
        Schema::dropIfExists('product_quality_specs');
        Schema::dropIfExists('product_bom');
        Schema::dropIfExists('product_documents');
        Schema::dropIfExists('product_images');

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table): void {
                foreach ([
                    'branch_id', 'factory_id', 'tenant_id', 'technical_notes', 'image_url',
                    'product_status', 'target_output_per_hour', 'standard_cycle_time', 'cavity_output',
                    'dimensions', 'product_volume', 'product_weight', 'barcode', 'short_name',
                    'product_name_en', 'product_name_ar', 'sku', 'product_code',
                ] as $col) {
                    if (Schema::hasColumn('products', $col)) {
                        $table->dropColumn($col);
                    }
                }
                foreach (['unit_id', 'color_id', 'plastic_material_id', 'category_id'] as $fk) {
                    if (Schema::hasColumn('products', $fk)) {
                        $table->dropConstrainedForeignId($fk);
                    }
                }
                foreach (['manufacturing_type', 'product_type'] as $col) {
                    if (Schema::hasColumn('products', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        Schema::dropIfExists('product_colors');
        Schema::dropIfExists('plastic_materials');
        Schema::dropIfExists('product_categories');
        Schema::dropIfExists('units');
    }
};
