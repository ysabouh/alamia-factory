<?php

namespace App\Console\Commands;

use Database\Seeders\ProductionDemoSeeder;
use Illuminate\Console\Command;

class SeedDemoDataCommand extends Command
{
    protected $signature = 'factory:seed-demo {--force : إعادة توليد أوامر DEMO حتى لو وُجدت}';

    protected $description = 'توليد بيانات تجريبية للإنتاج دون تفريغ قاعدة البيانات';

    public function handle(): int
    {
        $this->call('factory:db-backup', ['--label' => 'before-seed-demo']);

        $seeder = new ProductionDemoSeeder;
        $seeder->setCommand($this);
        $seeder->run((bool) $this->option('force'));

        $this->info('انتهى توليد البيانات التجريبية (المعطيات الحالية محفوظة).');

        return self::SUCCESS;
    }
}
