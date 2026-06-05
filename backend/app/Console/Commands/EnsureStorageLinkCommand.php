<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class EnsureStorageLinkCommand extends Command
{
    protected $signature = 'factory:ensure-storage-link';

    protected $description = 'Ensure public/storage points to storage/app/public (symlink or Windows junction)';

    public function handle(): int
    {
        $link = public_path('storage');
        $target = storage_path('app/public');

        if (! File::isDirectory($target)) {
            File::makeDirectory($target, 0755, true);
        }

        if (File::exists($link)) {
            $this->info('public/storage already exists.');

            return self::SUCCESS;
        }

        if (PHP_OS_FAMILY === 'Windows') {
            $ok = $this->createWindowsJunction($link, $target);
            if ($ok) {
                $this->info('Created Windows junction: public/storage → storage/app/public');

                return self::SUCCESS;
            }
        }

        $this->call('storage:link');

        if (File::exists($link)) {
            $this->info('Storage link ready.');

            return self::SUCCESS;
        }

        $this->error('Could not create public/storage. Run as admin or create junction manually.');

        return self::FAILURE;
    }

    private function createWindowsJunction(string $link, string $target): bool
    {
        $cmd = 'cmd /c mklink /J '.escapeshellarg($link).' '.escapeshellarg($target);
        exec($cmd, $output, $code);

        return $code === 0 && File::exists($link);
    }
}
