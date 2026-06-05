<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('quality_checklists')) {
            Schema::create('quality_checklists', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->index(['product_id', 'is_active'], 'qc_list_product_idx');
            });
        }

        if (! Schema::hasTable('quality_checklist_items')) {
            Schema::create('quality_checklist_items', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('checklist_id')->constrained('quality_checklists')->cascadeOnDelete();
                $table->string('item_name');
                $table->string('item_type')->default('numeric');
                $table->decimal('min_value', 14, 4)->nullable();
                $table->decimal('max_value', 14, 4)->nullable();
                $table->string('unit')->nullable();
                $table->json('selection_options')->nullable();
                $table->unsignedSmallInteger('sort_order')->default(10);
                $table->boolean('is_required')->default(true);
                $table->boolean('is_critical')->default(false);
                $table->timestamps();
                $table->index(['checklist_id', 'sort_order'], 'qc_item_sort_idx');
            });
        }

        if (Schema::hasTable('quality_defects') && ! Schema::hasColumn('quality_defects', 'code')) {
            Schema::rename('quality_defects', 'quality_inspection_legacy_defects');
        }

        if (! Schema::hasTable('quality_defects')) {
            Schema::create('quality_defects', function (Blueprint $table): void {
                $table->id();
                $table->string('code')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('quality_inspections')) {
            Schema::table('quality_inspections', function (Blueprint $table): void {
                if (! Schema::hasColumn('quality_inspections', 'work_order_id')) {
                    $table->foreignId('work_order_id')->nullable()->after('id')->constrained()->nullOnDelete();
                }
                if (! Schema::hasColumn('quality_inspections', 'quality_employee_id')) {
                    $table->foreignId('quality_employee_id')->nullable()->after('work_order_id')->constrained('employees')->nullOnDelete();
                }
                if (! Schema::hasColumn('quality_inspections', 'inspection_time')) {
                    $table->dateTime('inspection_time')->nullable()->after('quality_employee_id');
                }
                if (! Schema::hasColumn('quality_inspections', 'status')) {
                    $table->string('status')->default('passed')->index('qi_status_idx')->after('inspection_time');
                }
                if (! Schema::hasColumn('quality_inspections', 'corrective_action')) {
                    $table->text('corrective_action')->nullable()->after('notes');
                }
                if (! Schema::hasColumn('quality_inspections', 'is_final')) {
                    $table->boolean('is_final')->default(false)->after('corrective_action');
                }
            });

            if (Schema::hasColumn('quality_inspections', 'production_entry_id')) {
                Schema::table('quality_inspections', function (Blueprint $table): void {
                    $table->unsignedBigInteger('production_entry_id')->nullable()->change();
                });
            }
        }

        if (! Schema::hasTable('quality_inspection_results')) {
            Schema::create('quality_inspection_results', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('quality_inspection_id')->constrained()->cascadeOnDelete();
                $table->foreignId('checklist_item_id')->constrained('quality_checklist_items')->cascadeOnDelete();
                $table->string('measured_value')->nullable();
                $table->string('result_status')->default('pass');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->unique(['quality_inspection_id', 'checklist_item_id'], 'qi_result_uq');
            });
        }

        if (! Schema::hasTable('quality_inspection_photos')) {
            Schema::create('quality_inspection_photos', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('quality_inspection_id')->constrained()->cascadeOnDelete();
                $table->string('file_path');
                $table->string('file_name')->nullable();
                $table->timestamp('uploaded_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('quality_inspection_defects')) {
            Schema::create('quality_inspection_defects', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('quality_inspection_id')->constrained()->cascadeOnDelete();
                $table->foreignId('defect_id')->constrained('quality_defects')->cascadeOnDelete();
                $table->unsignedInteger('quantity')->default(1);
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('quality_inspection_defects');
        Schema::dropIfExists('quality_inspection_photos');
        Schema::dropIfExists('quality_inspection_results');
        Schema::dropIfExists('quality_checklist_items');
        Schema::dropIfExists('quality_checklists');

        if (Schema::hasTable('quality_defects')) {
            Schema::dropIfExists('quality_defects');
        }

        if (Schema::hasTable('quality_inspection_legacy_defects')) {
            Schema::rename('quality_inspection_legacy_defects', 'quality_defects');
        }
    }
};
