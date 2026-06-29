<?php

namespace Database\Seeders;

use App\Domain\Factory\Models\Currency;
use App\Domain\Factory\Models\Employee;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        Currency::query()->updateOrCreate(
            ['code' => 'USD'],
            [
                'name' => 'دولار أمريكي',
                'symbol' => '$',
                'usd_exchange_rate' => 1,
                'is_base' => true,
                'is_active' => true,
            ]
        );

        // تعطيل العملات الأخرى — النظام يستخدم USD فقط للرواتب
        Currency::query()
            ->where('code', '!=', 'USD')
            ->update(['is_active' => false]);

        $usd = Currency::query()->where('code', 'USD')->first();

        if ($usd) {
            $nonUsdIds = Currency::query()->where('code', '!=', 'USD')->pluck('id');

            Employee::query()
                ->where(function ($q) use ($usd, $nonUsdIds): void {
                    $q->whereNull('currency_id');
                    if ($nonUsdIds->isNotEmpty()) {
                        $q->orWhereIn('currency_id', $nonUsdIds);
                    }
                })
                ->update(['currency_id' => $usd->id]);
        }
    }
}
