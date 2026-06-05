<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\Process;

class DatabaseBackup
{
    public static function directory(): string
    {
        $dir = storage_path('backups/database');
        if (! File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        return $dir;
    }

    public static function resolveMysqlBinary(string $name): string
    {
        $candidates = array_filter([
            env('MYSQL_BIN_DIR') ? rtrim((string) env('MYSQL_BIN_DIR'), '\\/').DIRECTORY_SEPARATOR.$name : null,
            'C:\\xampp\\mysql\\bin\\'.$name,
            'C:\\xampp\\mysql\\bin\\'.$name.'.exe',
        ]);

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return $name;
    }

    /**
     * @return array{0: string, 1: string, 2: string, 3: string}
     */
    public static function connectionCredentials(): array
    {
        $connection = config('database.connections.'.config('database.default'));

        return [
            (string) ($connection['host'] ?? '127.0.0.1'),
            (string) ($connection['port'] ?? '3306'),
            (string) ($connection['database'] ?? ''),
            (string) ($connection['username'] ?? 'root'),
            (string) ($connection['password'] ?? ''),
        ];
    }

    public static function backup(?string $label = null): string
    {
        [$host, $port, $database, $username, $password] = self::connectionCredentials();

        if ($database === '') {
            throw new RuntimeException('اسم قاعدة البيانات غير معرّف في الإعدادات.');
        }

        $stamp = now()->format('Y-m-d_His');
        $suffix = $label ? preg_replace('/[^a-zA-Z0-9_-]+/', '-', $label) : 'auto';
        $file = self::directory().DIRECTORY_SEPARATOR."{$database}_{$stamp}_{$suffix}.sql";

        $mysqldump = self::resolveMysqlBinary('mysqldump');
        $process = new Process([
            $mysqldump,
            '--host='.$host,
            '--port='.$port,
            '--user='.$username,
            '--single-transaction',
            '--routines',
            '--triggers',
            '--add-drop-table',
            $database,
        ]);
        $process->setTimeout(600);
        if ($password !== '') {
            $process->setEnv(['MYSQL_PWD' => $password] + $_ENV);
        }
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException(trim($process->getErrorOutput() ?: $process->getOutput() ?: 'فشل mysqldump'));
        }

        File::put($file, $process->getOutput());

        return $file;
    }

    public static function restore(string $file): void
    {
        if (! is_file($file)) {
            throw new RuntimeException("ملف النسخة غير موجود: {$file}");
        }

        [$host, $port, $database, $username, $password] = self::connectionCredentials();

        if ($database === '') {
            throw new RuntimeException('اسم قاعدة البيانات غير معرّف في الإعدادات.');
        }

        $mysql = self::resolveMysqlBinary('mysql');
        $process = new Process([
            $mysql,
            '--host='.$host,
            '--port='.$port,
            '--user='.$username,
            $database,
        ]);
        $process->setInput(File::get($file));
        $process->setTimeout(600);
        if ($password !== '') {
            $process->setEnv(['MYSQL_PWD' => $password] + $_ENV);
        }
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException(trim($process->getErrorOutput() ?: $process->getOutput() ?: 'فشل استعادة النسخة'));
        }
    }

    /**
     * @return list<string>
     */
    public static function listBackups(): array
    {
        $files = glob(self::directory().DIRECTORY_SEPARATOR.'*.sql') ?: [];

        rsort($files);

        return $files;
    }

    public static function latestBackup(): ?string
    {
        return self::listBackups()[0] ?? null;
    }
}
