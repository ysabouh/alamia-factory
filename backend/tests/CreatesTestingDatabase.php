<?php

namespace Tests;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait CreatesTestingDatabase
{
    protected function ensureTestingDatabaseExists(): void
    {
        if (! app()->environment('testing')) {
            return;
        }

        $database = (string) config('database.connections.mysql.database');
        if ($database === '' || $database === 'myfactory') {
            return;
        }

        $charset = config('database.connections.mysql.charset', 'utf8mb4');
        $collation = config('database.connections.mysql.collation', 'utf8mb4_unicode_ci');

        DB::statement("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET {$charset} COLLATE {$collation}");
        Schema::connection('mysql')->getConnection()->reconnect();
    }
}
