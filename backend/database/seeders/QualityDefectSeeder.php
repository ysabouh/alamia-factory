<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class QualityDefectSeeder extends Seeder
{
    public function run(): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('quality_defects')) {
            return;
        }

        $defects = [
            ['flash', 'Flash', 'Excess material at parting line'],
            ['short_shot', 'Short Shot', 'Incomplete fill'],
            ['burn_mark', 'Burn Mark', 'Discoloration from overheating'],
            ['crack', 'Crack', 'Structural crack'],
            ['leakage', 'Leakage', 'Seal or wall leak'],
            ['dimension_issue', 'Dimension Issue', 'Out of tolerance dimensions'],
            ['color_variation', 'Color Variation', 'Color deviation from standard'],
        ];

        $now = now();
        foreach ($defects as [$code, $name, $description]) {
            if (DB::table('quality_defects')->where('code', $code)->exists()) {
                continue;
            }
            DB::table('quality_defects')->insert([
                'code' => $code,
                'name' => $name,
                'description' => $description,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
