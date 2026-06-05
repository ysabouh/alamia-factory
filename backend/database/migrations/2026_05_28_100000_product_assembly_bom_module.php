<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('products') && ! Schema::hasColumn('products', 'assembly_type')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->string('assembly_type')->default('single')->index()->after('product_type');
            });
        }

        if (Schema::hasTable('products') && ! Schema::hasColumn('products', 'standard_cost')) {
            Schema::table('products', function (Blueprint $table): void {
                $table->decimal('standard_cost', 14, 4)->nullable()->after('standard_weight_grams');
            });
        }

        if (Schema::hasTable('product_bom')) {
            Schema::table('product_bom', function (Blueprint $table): void {
                if (! Schema::hasColumn('product_bom', 'child_product_id')) {
                    $table->unsignedBigInteger('child_product_id')->nullable()->after('product_id');
                }
            });

            if (Schema::hasColumn('product_bom', 'material_product_id') && Schema::hasColumn('product_bom', 'child_product_id')) {
                DB::table('product_bom')
                    ->whereNull('child_product_id')
                    ->update(['child_product_id' => DB::raw('`material_product_id`')]);
            }

            Schema::table('product_bom', function (Blueprint $table): void {
                if (Schema::hasColumn('product_bom', 'child_product_id')) {
                    $table->foreign('child_product_id')->references('id')->on('products')->cascadeOnDelete();
                }
                if (! Schema::hasColumn('product_bom', 'component_type')) {
                    $table->string('component_type')->default('component')->index()->after('unit_id');
                }
                if (! Schema::hasColumn('product_bom', 'is_optional')) {
                    $table->boolean('is_optional')->default(false)->after('waste_percentage');
                }
                if (! Schema::hasColumn('product_bom', 'sequence_order')) {
                    $table->unsignedSmallInteger('sequence_order')->default(1)->after('is_optional');
                }
            });
        }

        if (! Schema::hasTable('assembly_work_orders')) {
            Schema::create('assembly_work_orders', function (Blueprint $table): void {
                $table->id();
                $table->string('work_order_code')->unique();
                $table->foreignId('final_product_id')->constrained('products')->cascadeOnDelete();
                $table->unsignedInteger('planned_quantity');
                $table->unsignedInteger('completed_quantity')->default(0);
                $table->string('status')->default('draft')->index();
                $table->date('planned_start_date')->nullable();
                $table->date('planned_end_date')->nullable();
                $table->timestamp('actual_start_date')->nullable();
                $table->timestamp('actual_end_date')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('assembly_operations')) {
            Schema::create('assembly_operations', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('assembly_work_order_id')->constrained()->cascadeOnDelete();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->unsignedInteger('quantity_produced')->default(0);
                $table->unsignedInteger('quantity_rejected')->default(0);
                $table->foreignId('operator_id')->nullable()->constrained('employees')->nullOnDelete();
                $table->foreignId('machine_id')->nullable()->constrained('machines')->nullOnDelete();
                $table->timestamp('assembly_start_time')->nullable();
                $table->timestamp('assembly_end_time')->nullable();
                $table->unsignedInteger('production_duration')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('assembly_components_consumption')) {
            Schema::create('assembly_components_consumption', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('assembly_operation_id')->constrained()->cascadeOnDelete();
                $table->foreignId('component_product_id')->constrained('products')->cascadeOnDelete();
                $table->decimal('planned_quantity', 14, 4);
                $table->decimal('actual_quantity', 14, 4);
                $table->decimal('waste_quantity', 14, 4)->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('assembly_components_consumption');
        Schema::dropIfExists('assembly_operations');
        Schema::dropIfExists('assembly_work_orders');

        if (Schema::hasTable('product_bom')) {
            Schema::table('product_bom', function (Blueprint $table): void {
                foreach (['sequence_order', 'is_optional', 'component_type'] as $col) {
                    if (Schema::hasColumn('product_bom', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
            if (Schema::hasColumn('product_bom', 'child_product_id') && ! Schema::hasColumn('product_bom', 'material_product_id')) {
                Schema::table('product_bom', function (Blueprint $table): void {
                    $table->renameColumn('child_product_id', 'material_product_id');
                });
            }
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table): void {
                if (Schema::hasColumn('products', 'assembly_type')) {
                    $table->dropColumn('assembly_type');
                }
                if (Schema::hasColumn('products', 'standard_cost')) {
                    $table->dropColumn('standard_cost');
                }
            });
        }
    }
};
