<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$instance = App\Domain\Factory\Models\WorkflowInstance::find(5);
$versionId = $instance->template_version_id;

$stages = App\Domain\Factory\Models\WorkflowStage::where('template_version_id', $versionId)->orderBy('stage_number')->get();
echo "Stages:\n";
foreach ($stages as $s) {
    echo "  {$s->id} #{$s->stage_number} {$s->name} next={$s->next_stage_id}\n";
}

echo "\nTransitions:\n";
foreach (App\Domain\Factory\Models\WorkflowStageTransition::where('template_version_id', $versionId)->get() as $t) {
    $from = $stages->firstWhere('id', $t->from_stage_id)?->name ?? '?';
    $to = $stages->firstWhere('id', $t->to_stage_id)?->name ?? '?';
    echo "  {$from} --[{$t->condition_type->value}]--> {$to} gateway={$t->from_gateway_node_id} label={$t->label}\n";
}
