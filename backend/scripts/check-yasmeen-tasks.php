<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$yasmeenId = App\Domain\Factory\Models\Employee::where('code', 'EMP-DEMO-SUP')->value('id');

$tasks = App\Domain\Factory\Models\WorkflowTask::with(['stage', 'instance'])
    ->where('assigned_to', $yasmeenId)
    ->orderByDesc('id')
    ->get();

echo "All Yasmeen tasks ({$tasks->count()}):\n";
foreach ($tasks as $t) {
    echo "- {$t->task_number} | {$t->instance?->workflow_number} | {$t->stage?->name} | {$t->status->value}\n";
}

echo "\nInstances:\n";
foreach (App\Domain\Factory\Models\WorkflowInstance::with('currentStage')->orderByDesc('id')->limit(10)->get() as $i) {
    echo "- {$i->id} {$i->workflow_number} | current: {$i->currentStage?->name} | {$i->status->value}\n";
}
