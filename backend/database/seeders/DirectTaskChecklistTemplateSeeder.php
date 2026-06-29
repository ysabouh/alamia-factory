<?php

namespace Database\Seeders;

use App\Domain\Factory\Models\DirectTaskChecklistTemplate;
use App\Domain\Factory\Models\DirectTaskChecklistTemplateItem;
use Illuminate\Database\Seeder;

class DirectTaskChecklistTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'code' => 'generator',
                'name' => 'مولد كهربائي',
                'items' => [
                    ['label' => 'فحص مستوى الزيت', 'item_type' => 'checkbox', 'is_required' => true],
                    ['label' => 'تصوير لوحة التحكم', 'item_type' => 'image', 'is_required' => true],
                    ['label' => 'قراءة ساعات التشغيل', 'item_type' => 'number', 'is_required' => true],
                    ['label' => 'رفع التقرير', 'item_type' => 'file', 'is_required' => true],
                    ['label' => 'الملاحظات', 'item_type' => 'comment', 'is_required' => false],
                ],
            ],
            [
                'code' => 'injection_machine',
                'name' => 'ماكينة حقن',
                'items' => [
                    ['label' => 'فحص درجة حرارة الباريل', 'item_type' => 'number', 'is_required' => true],
                    ['label' => 'تنظيف القالب', 'item_type' => 'checkbox', 'is_required' => true],
                    ['label' => 'صورة عينة الإنتاج', 'item_type' => 'image', 'is_required' => true],
                ],
            ],
            [
                'code' => 'compressor',
                'name' => 'كمبروسر',
                'items' => [
                    ['label' => 'فحص الضغط', 'item_type' => 'number', 'is_required' => true],
                    ['label' => 'فحص التسريبات', 'item_type' => 'checkbox', 'is_required' => true],
                ],
            ],
            [
                'code' => 'forklift',
                'name' => 'رافعة شوكية',
                'items' => [
                    ['label' => 'فحص الإطارات', 'item_type' => 'checkbox', 'is_required' => true],
                    ['label' => 'فحص البطارية', 'item_type' => 'checkbox', 'is_required' => true],
                    ['label' => 'توقيع المشغّل', 'item_type' => 'signature', 'is_required' => true],
                ],
            ],
            [
                'code' => 'warehouse_inventory',
                'name' => 'جرد مستودع',
                'items' => [
                    ['label' => 'عدّ الأصناف', 'item_type' => 'number', 'is_required' => true],
                    ['label' => 'مطابقة السجلات', 'item_type' => 'checkbox', 'is_required' => true],
                    ['label' => 'تاريخ الجرد', 'item_type' => 'date', 'is_required' => true],
                ],
            ],
        ];

        foreach ($templates as $index => $tpl) {
            $template = DirectTaskChecklistTemplate::query()->updateOrCreate(
                ['code' => $tpl['code']],
                [
                    'name' => $tpl['name'],
                    'description' => null,
                    'is_active' => true,
                ]
            );

            DirectTaskChecklistTemplateItem::query()->where('template_id', $template->id)->delete();

            foreach ($tpl['items'] as $sort => $item) {
                DirectTaskChecklistTemplateItem::query()->create([
                    'template_id' => $template->id,
                    'label' => $item['label'],
                    'item_type' => $item['item_type'],
                    'is_required' => $item['is_required'],
                    'sort_order' => $sort,
                ]);
            }
        }
    }
}
