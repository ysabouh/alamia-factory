<?php

namespace App\Console\Commands;

use App\Application\DirectTasks\DirectTaskSpawnService;
use Illuminate\Console\Command;

class SpawnRecurringDirectTasksCommand extends Command
{
    protected $signature = 'direct-tasks:spawn-recurring';

    protected $description = 'Spawn direct tasks from due recurring schedules';

    public function handle(DirectTaskSpawnService $spawn): int
    {
        $count = $spawn->spawnDue();
        $this->info("Spawned {$count} direct task(s).");

        return self::SUCCESS;
    }
}
