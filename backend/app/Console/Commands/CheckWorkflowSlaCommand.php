<?php

namespace App\Console\Commands;

use App\Application\Workflow\WorkflowSlaService;
use Illuminate\Console\Command;

class CheckWorkflowSlaCommand extends Command
{
    protected $signature = 'workflow:check-sla';

    protected $description = 'Mark overdue workflow tasks and escalate SLA breaches';

    public function handle(WorkflowSlaService $sla): int
    {
        $count = $sla->checkOverdue();
        $this->info("Marked {$count} overdue task(s).");

        return self::SUCCESS;
    }
}
