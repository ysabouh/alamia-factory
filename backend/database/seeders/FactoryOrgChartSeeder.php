<?php

namespace Database\Seeders;

use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\DepartmentOrgPosition;
use App\Domain\Factory\Models\Hall;
use App\Domain\Factory\Models\JobRole;
use Illuminate\Database\Seeder;

class FactoryOrgChartSeeder extends Seeder
{
    public function run(): void
    {
        $hallId = Hall::query()->orderBy('id')->value('id');
        if (! $hallId) {
            return;
        }

        $prod = Department::query()->updateOrCreate(
            ['code' => 'PROD'],
            [
                'name' => 'إنتاج',
                'vacancy_count' => 2,
                'is_active' => true,
                'hall_id' => $hallId,
                'parent_id' => null,
            ]
        );

        $injection = Department::query()->updateOrCreate(
            ['code' => 'PROD-INJ'],
            [
                'name' => 'حقن',
                'vacancy_count' => 1,
                'is_active' => true,
                'hall_id' => $hallId,
                'parent_id' => $prod->id,
            ]
        );

        Department::query()->updateOrCreate(
            ['code' => 'PROD-BLOW'],
            [
                'name' => 'نفخ وتعبئة',
                'vacancy_count' => 1,
                'is_active' => true,
                'hall_id' => $hallId,
                'parent_id' => $prod->id,
            ]
        );

        $departments = [
            ['code' => 'QUAL', 'name' => 'جودة', 'vacancy_count' => 1],
            ['code' => 'MAINT', 'name' => 'صيانة', 'vacancy_count' => 1],
            ['code' => 'WH', 'name' => 'مستودعات ولوجستيات', 'vacancy_count' => 1],
            ['code' => 'FIN', 'name' => 'مالية', 'vacancy_count' => 0],
            ['code' => 'HR', 'name' => 'موارد بشرية', 'vacancy_count' => 0],
            ['code' => 'SALES', 'name' => 'مبيعات وتسويق', 'vacancy_count' => 1],
            ['code' => 'PUR', 'name' => 'مشتريات', 'vacancy_count' => 0],
        ];

        foreach ($departments as $dept) {
            Department::query()->updateOrCreate(
                ['code' => $dept['code']],
                [
                    'name' => $dept['name'],
                    'vacancy_count' => $dept['vacancy_count'],
                    'is_active' => true,
                    'hall_id' => $hallId,
                    'parent_id' => null,
                ]
            );
        }

        foreach (
            [
                ['code' => 'SUP', 'name' => 'مشرف'],
                ['code' => 'OP', 'name' => 'مشغّل'],
            ] as $pos
        ) {
            DepartmentOrgPosition::query()->updateOrCreate(
                ['department_id' => $injection->id, 'code' => $pos['code']],
                [
                    'name' => $pos['name'],
                    'sort_order' => $pos['code'] === 'SUP' ? 1 : 2,
                    'is_active' => true,
                ]
            );
        }

        $roles = [
            ['code' => 'GM', 'name' => 'مدير عام', 'role_level' => 10],
            ['code' => 'DEPT_MGR', 'name' => 'مدير قسم', 'role_level' => 8],
            ['code' => 'SUPERVISOR', 'name' => 'مشرف', 'role_level' => 6],
            ['code' => 'TEAM_LEAD', 'name' => 'قائد فريق', 'role_level' => 4],
            ['code' => 'OPERATOR', 'name' => 'مشغّل', 'role_level' => 2],
            ['code' => 'WORKER', 'name' => 'عامل', 'role_level' => 1],
        ];

        foreach ($roles as $role) {
            JobRole::query()->updateOrCreate(
                ['code' => $role['code']],
                [
                    'name' => $role['name'],
                    'role_level' => $role['role_level'],
                    'is_active' => true,
                ]
            );
        }
    }
}
