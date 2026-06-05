<?php
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo 'machines='.App\Domain\Factory\Models\Machine::count().PHP_EOL;
echo 'types='.App\Domain\Factory\Models\MachineType::count().PHP_EOL;
