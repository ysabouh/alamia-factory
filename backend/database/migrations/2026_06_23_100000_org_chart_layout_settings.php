<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('org_chart_layout_settings')) {
            Schema::create('org_chart_layout_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('scope')->default('factory')->unique();
                $table->json('settings');
                $table->json('positions')->nullable();
                $table->timestamps();
            });

            DB::table('org_chart_layout_settings')->insert([
                'scope' => 'factory',
                'settings' => json_encode([
                    'layoutMode' => 'auto',
                    'direction' => 'TB',
                    'nodeSep' => 40,
                    'rankSep' => 70,
                    'edgeType' => 'smoothstep',
                    'reparentOnDrag' => false,
                    'departmentColors' => new \stdClass,
                ], JSON_THROW_ON_ERROR),
                'positions' => json_encode(new \stdClass, JSON_THROW_ON_ERROR),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('org_chart_layout_settings');
    }
};
