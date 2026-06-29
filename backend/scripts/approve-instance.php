<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$number = $argv[1] ?? 'WF-2026-00004';
$approve = ($argv[2] ?? '') === 'approve';

$i = App\Domain\Factory\Models\WorkflowInstance::query()
    ->where('workflow_number', $number)
    ->with(['currentStage', 'tasks.stage'])
    ->first();

if (! $i) {
    echo "NOT FOUND\n";
    exit(1);
}

echo "status={$i->status->value} stage={$i->currentStage?->name}\n";

$task = $i->tasks->where('stage_id', $i->current_stage_id)->first();
if (! $task) {
    echo "NO TASK\n";
    exit(1);
}

echo "task={$task->task_number} task_status={$task->status->value}\n";
echo "stage_requires_approval=".($task->stage?->requires_approval ? 'yes' : 'no')."\n";
echo "current_stage_requires_approval=".($i->currentStage?->requires_approval ? 'yes' : 'no')."\n";

if ($approve && $i->status->value === 'waiting_approval') {
    $execution = app(App\Application\Workflow\WorkflowExecutionService::class);
    $execution->approveTask($task);
    $i->refresh();
    echo "AFTER APPROVE status={$i->status->value} completed_at=".($i->completed_at ?? 'null')."\n";
}
