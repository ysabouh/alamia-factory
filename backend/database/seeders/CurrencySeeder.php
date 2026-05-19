<?php

namespace Database\Seeders;

use App\Domain\Factory\Models\Currency;
use App\Domain\Factory\Models\Employee;
use Illuminate\Database\Seeder;

class CurrencySeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'code' => 'USD',
                'name' => 'دولار أمريكي',
                'symbol' => '$',
                'usd_exchange_rate' => 1,
                'is_base' => true,
                'is_active' => true,
            ],
            [
                'code' => 'SYP',
                'name' => 'ليرة سورية',
                'symbol' => 'ل.س',
                'usd_exchange_rate' => 13000,
                'is_base' => false,
                'is_active' => true,
            ],
            [
                'code' => 'SAR',
                'name' => 'ريال سعودي',
                'symbol' => 'ر.س',
                'usd_exchange_rate' => 3.75,
                'is_base' => false,
                'is_active' => true,
            ],
            [
                'code' => 'EUR',
                'name' => 'يورو',
                'symbol' => '€',
                'usd_exchange_rate' => 0.92,
                'is_base' => false,
                'is_active' => true,
            ],
            [
                'code' => 'TRY',
                'name' => 'ليرة تركية',
                'symbol' => '₺',
                'usd_exchange_rate' => 32.5,
                'is_base' => false,
                'is_active' => true,
            ],
            [
                'code' => 'AED',
                'name' => 'درهم إماراتي',
                'symbol' => 'د.إ',
                'usd_exchange_rate' => 3.6725,
                'is_base' => false,
                'is_active' => true,
            ],
        ];

        foreach ($rows as $row) {
            Currency::query()->updateOrCreate(
                ['code' => $row['code']],
                $row
            );
        }

        $default = Currency::query()->where('code', 'SYP')->first()
            ?? Currency::query()->where('is_base', true)->first();

        if ($default) {
            Employee::query()
                ->whereNull('currency_id')
                ->update(['currency_id' => $default->id]);
        }
    }
}
