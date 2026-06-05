<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('products') && ! Schema::hasColumn('products', 'manufacturing_mode')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->string('manufacturing_mode')->default('manufactured')->index()->after('assembly_type');
            });
        }

        if (! Schema::hasTable('work_centers')) {
            Schema::create('work_centers', function (Blueprint $table): void {
                $table->id();
                $table->string('work_center_code')->unique();
                $table->string('work_center_name');
                $table->foreignId('hall_id')->nullable()->constrained('halls')->nullOnDelete();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('product_operations')) {
            Schema::create('product_operations', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->string('operation_code');
                $table->string('operation_name');
                $table->string('operation_type');
                $table->unsignedSmallInteger('sequence_order')->default(10);
                $table->foreignId('machine_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('mold_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('work_center_id')->nullable()->constrained('work_centers')->nullOnDelete();
                $table->unsignedInteger('setup_time')->nullable();
                $table->unsignedInteger('cycle_time')->nullable();
                $table->unsignedInteger('labor_time')->nullable();
                $table->unsignedInteger('cooling_time')->nullable();
                $table->text('operation_instructions')->nullable();
                $table->boolean('qc_required')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['product_id', 'operation_code'], 'product_ops_code_uq');
                $table->unique(['product_id', 'sequence_order'], 'product_ops_seq_uq');
            });
        }

        if (! Schema::hasTable('operation_machine_settings')) {
            Schema::create('operation_machine_settings', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_operation_id')->constrained()->cascadeOnDelete();
                $table->foreignId('machine_id')->constrained()->cascadeOnDelete();
                $table->decimal('injection_pressure', 10, 2)->nullable();
                $table->decimal('holding_pressure', 10, 2)->nullable();
                $table->unsignedInteger('cooling_time')->nullable();
                $table->decimal('mold_temperature', 8, 2)->nullable();
                $table->json('barrel_temperature_profile')->nullable();
                $table->decimal('clamp_force', 12, 2)->nullable();
                $table->decimal('shot_weight', 10, 3)->nullable();
                $table->unsignedInteger('screw_speed')->nullable();
                $table->decimal('back_pressure', 10, 2)->nullable();
                $table->text('setup_notes')->nullable();
                $table->timestamps();

                $table->unique(['product_operation_id', 'machine_id'], 'op_machine_settings_uq');
            });
        }

        if (! Schema::hasTable('operation_material_consumption')) {
            Schema::create('operation_material_consumption', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_operation_id')->constrained()->cascadeOnDelete();
                $table->foreignId('material_product_id')->constrained('products')->cascadeOnDelete();
                $table->decimal('planned_quantity', 14, 4)->default(0);
                $table->decimal('actual_quantity', 14, 4)->nullable();
                $table->decimal('waste_quantity', 14, 4)->nullable();
                $table->timestamps();

                $table->unique(['product_operation_id', 'material_product_id'], 'op_material_unique');
            });
        }

        if (! Schema::hasTable('operation_quality_specs')) {
            Schema::create('operation_quality_specs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_operation_id')->constrained()->cascadeOnDelete();
                $table->string('inspection_type');
                $table->decimal('tolerance_min', 14, 4)->nullable();
                $table->decimal('tolerance_max', 14, 4)->nullable();
                $table->string('inspection_frequency')->nullable();
                $table->text('qc_notes')->nullable();
                $table->timestamps();
            });
        }

        $this->backfillManufacturingMode();
        $this->migrateLegacyProductOperations();
    }

    private function backfillManufacturingMode(): void
    {
        if (! Schema::hasTable('products') || ! Schema::hasColumn('products', 'manufacturing_mode')) {
            return;
        }

        $products = DB::table('products')->select('id', 'product_type', 'assembly_type', 'manufacturing_type')->get();

        foreach ($products as $product) {
            $hasBom = Schema::hasTable('product_bom')
                && DB::table('product_bom')->where('product_id', $product->id)->exists();
            $hasMolds = Schema::hasTable('product_molds')
                && DB::table('product_molds')->where('product_id', $product->id)->exists();
            $hasMachineSettings = Schema::hasTable('product_machine_settings')
                && DB::table('product_machine_settings')->where('product_id', $product->id)->exists();
            $hasManufacturing = $hasMolds || $hasMachineSettings || ! empty($product->manufacturing_type);

            $mode = 'manufactured';
            if ($product->product_type === 'raw_material' && ! $hasManufacturing && ! $hasBom) {
                $mode = 'purchased';
            } elseif ($hasManufacturing && $hasBom) {
                $mode = 'hybrid';
            } elseif (($product->assembly_type ?? '') === 'assembly' && ! $hasManufacturing) {
                $mode = 'assembled';
            } elseif ($hasBom && ! $hasManufacturing) {
                $mode = 'assembled';
            } elseif (! $hasManufacturing && ! $hasBom) {
                $mode = $product->product_type === 'raw_material' ? 'purchased' : 'manufactured';
            }

            DB::table('products')->where('id', $product->id)->update(['manufacturing_mode' => $mode]);
        }
    }

    private function migrateLegacyProductOperations(): void
    {
        if (! Schema::hasTable('product_operations')) {
            return;
        }

        if (DB::table('product_operations')->exists()) {
            return;
        }

        $typeMap = [
            'injection' => 'injection',
            'pet_blow' => 'blow',
            'compression' => 'compression',
            'polyethylene' => 'injection',
        ];

        if (Schema::hasTable('product_machine_settings')) {
            $settings = DB::table('product_machine_settings')
                ->join('products', 'products.id', '=', 'product_machine_settings.product_id')
                ->select(
                    'product_machine_settings.*',
                    'products.manufacturing_type',
                    'products.product_code',
                    'products.product_name_ar'
                )
                ->get();

            foreach ($settings as $row) {
                $opType = $typeMap[$row->manufacturing_type ?? ''] ?? 'injection';
                $code = 'OP-'.str_pad((string) $row->product_id, 4, '0', STR_PAD_LEFT).'-M'.$row->machine_id;
                $moldId = null;
                if (Schema::hasTable('product_molds')) {
                    $moldId = DB::table('product_molds')
                        ->where('product_id', $row->product_id)
                        ->orderByDesc('is_default')
                        ->orderBy('priority')
                        ->value('mold_id');
                }

                $operationId = DB::table('product_operations')->insertGetId([
                    'product_id' => $row->product_id,
                    'operation_code' => $code,
                    'operation_name' => ($row->product_name_ar ?? $row->product_code ?? 'Product').' — '.$opType,
                    'operation_type' => $opType,
                    'sequence_order' => 10,
                    'machine_id' => $row->machine_id,
                    'mold_id' => $moldId,
                    'cycle_time' => $row->cycle_time,
                    'cooling_time' => $row->cooling_time,
                    'qc_required' => false,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('operation_machine_settings')->insert([
                    'product_operation_id' => $operationId,
                    'machine_id' => $row->machine_id,
                    'injection_pressure' => $row->injection_pressure,
                    'holding_pressure' => $row->holding_pressure,
                    'cooling_time' => $row->cooling_time,
                    'mold_temperature' => $row->mold_temperature,
                    'barrel_temperature_profile' => $row->barrel_temperature_profile,
                    'clamp_force' => $row->clamp_force,
                    'shot_weight' => $row->shot_weight,
                    'screw_speed' => $row->screw_speed,
                    'back_pressure' => $row->back_pressure,
                    'setup_notes' => $row->setup_notes,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        if (Schema::hasTable('product_molds')) {
            $molds = DB::table('product_molds')
                ->join('products', 'products.id', '=', 'product_molds.product_id')
                ->leftJoin('product_operations', function ($join): void {
                    $join->on('product_operations.product_id', '=', 'product_molds.product_id')
                        ->on('product_operations.mold_id', '=', 'product_molds.mold_id');
                })
                ->whereNull('product_operations.id')
                ->select(
                    'product_molds.*',
                    'products.manufacturing_type',
                    'products.product_code',
                    'products.product_name_ar'
                )
                ->get();

            foreach ($molds as $row) {
                $opType = $typeMap[$row->manufacturing_type ?? ''] ?? 'injection';
                $seq = (int) DB::table('product_operations')->where('product_id', $row->product_id)->max('sequence_order') + 10;
                if ($seq < 10) {
                    $seq = 10;
                }
                $code = 'OP-'.str_pad((string) $row->product_id, 4, '0', STR_PAD_LEFT).'-D'.$row->mold_id;

                DB::table('product_operations')->insert([
                    'product_id' => $row->product_id,
                    'operation_code' => $code,
                    'operation_name' => ($row->product_name_ar ?? $row->product_code ?? 'Product').' — mold',
                    'operation_type' => $opType,
                    'sequence_order' => $seq,
                    'mold_id' => $row->mold_id,
                    'qc_required' => false,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_quality_specs');
        Schema::dropIfExists('operation_material_consumption');
        Schema::dropIfExists('operation_machine_settings');
        Schema::dropIfExists('product_operations');
        Schema::dropIfExists('work_centers');

        if (Schema::hasTable('products') && Schema::hasColumn('products', 'manufacturing_mode')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->dropColumn('manufacturing_mode');
            });
        }
    }
};
