<?php

namespace App\Console\Commands;

use App\Support\DatabaseBackup;
use Illuminate\Console\Command;

class BackupDatabaseCommand extends Command
{
    protected $signature = 'factory:db-backup {--label=manual : وسم اختياري لاسم الملف}';

    protected $description = 'نسخ احتياطي لقاعدة البيانات (بدون حذف المعطيات)';

    public function handle(): int
    {
        try {
            $file = DatabaseBackup::backup((string) $this->option('label'));
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info('تم حفظ النسخة الاحتياطية.');
        $this->line('  '.$file);

        return self::SUCCESS;
    }
}
