<?php

namespace App\Console\Commands;

use App\Support\DatabaseBackup;
use Illuminate\Console\Command;

class RestoreDatabaseCommand extends Command
{
    protected $signature = 'factory:db-restore
                            {file? : مسار ملف .sql أو اتركه فارغاً لآخر نسخة}
                            {--force : تنفيذ الاستعادة بدون تأكيد}';

    protected $description = 'استعادة قاعدة البيانات من نسخة احتياطية';

    public function handle(): int
    {
        $file = $this->argument('file');
        if ($file === null || $file === '') {
            $file = DatabaseBackup::latestBackup();
            if ($file === null) {
                $this->error('لا توجد نسخ احتياطية. شغّل: php artisan factory:db-backup');

                return self::FAILURE;
            }
        }

        if (! is_file($file)) {
            $candidate = DatabaseBackup::directory().DIRECTORY_SEPARATOR.$file;
            if (is_file($candidate)) {
                $file = $candidate;
            }
        }

        $this->warn('سيتم استبدال معطيات قاعدة البيانات الحالية بالنسخة:');
        $this->line('  '.$file);

        if (! $this->option('force') && ! $this->confirm('هل تريد المتابعة؟', false)) {
            $this->info('أُلغيت العملية.');

            return self::SUCCESS;
        }

        try {
            DatabaseBackup::restore($file);
        } catch (\Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info('تمت استعادة قاعدة البيانات بنجاح.');

        return self::SUCCESS;
    }
}
