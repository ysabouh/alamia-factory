<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('product_bom')) {
            return;
        }

        if (Schema::hasColumn('product_bom', 'material_product_id')) {
            DB::statement('ALTER TABLE `product_bom` MODIFY `material_product_id` BIGINT UNSIGNED NULL');
        }

        if (Schema::hasColumn('product_bom', 'child_product_id') && Schema::hasColumn('product_bom', 'material_product_id')) {
            DB::table('product_bom')
                ->whereNull('material_product_id')
                ->whereNotNull('child_product_id')
                ->update(['material_product_id' => DB::raw('`child_product_id`')]);
        }
    }

    public function down(): void
    {
        // no-op
    }
};
