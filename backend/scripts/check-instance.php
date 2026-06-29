<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$number = $argv[1] ?? 'WF-2026-00004';

$i = App\Domain\Factory\Models\WorkflowInstance::query()
    ->where('workflow_number', $number)
    ->with(['currentStage', 'tasks.stage', 'tasks.assignee', 'templateVersion.stages', 'templateVersion.transitions'])
    ->first();

if (! $i) {
    echo "NOT FOUND: {$number}\n";
    exit(1);
}

echo "status={$i->status->value}\n";
echo 'current_stage='.($i->currentStage?->name ?? 'null').' id='.($i->current_stage_id ?? 'null')."\n";
echo "progress={$i->progress_percent}\n";
echo 'completed_at='.($i->completed_at ?? 'null')."\n\n";

foreach ($i->templateVersion->stages->sortBy('stage_number') as $s) {
    $tasks = $i->tasks->where('stage_id', $s->id);
    echo "STAGE #{$s->stage_number} {$s->name} node={$s->node_id} req_approval=".($s->requires_approval ? 'yes' : 'no').' next='.($s->next_stage_id ?? 'null')."\n";
    foreach ($tasks as $t) {
        $assignee = $t->assignee?->name ?? (string) $t->assigned_to;
        echo "  TASK {$t->task_number} status={$t->status->value} assignee={$assignee} completed=".($t->completed_at ?? 'null')."\n";
    }
}

$close = $i->templateVersion->stages->firstWhere('name', 'مراجعة وإغلاق');
if ($close) {
    echo "\nTRANSITIONS from مراجعة وإغلاق:\n";
    $fromClose = $i->templateVersion->transitions->where('from_stage_id', $close->id);
    if ($fromClose->isEmpty()) {
        echo "  (none — terminal stage)\n";
    }
    foreach ($fromClose as $tr) {
        echo "  to={$tr->to_stage_id} cond={$tr->condition_type->value} gw=".($tr->from_gateway_node_id ?? 'null')."\n";
    }
}
