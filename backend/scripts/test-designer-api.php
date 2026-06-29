<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = config('factory.superadmin.email');
$user = App\Domain\Factory\Models\User::where('email', $email)->first();
if (! $user) {
    echo "NO_USER\n";
    exit(1);
}

$template = App\Domain\Factory\Models\WorkflowTemplate::where('code', 'MAINTENANCE_REQUEST')->first();
if (! $template) {
    echo "NO_TEMPLATE\n";
    exit(1);
}

Illuminate\Support\Facades\Auth::login($user);
$controller = app(App\Interfaces\Http\Controllers\Api\V1\Workflow\WorkflowTemplatesController::class);

$show = json_decode($controller->show($template)->getContent(), true);
$draft = collect($show['versions'] ?? [])->firstWhere('status', 'draft');
$versionId = $draft['id'] ?? null;

echo "template_id={$template->id}\n";
echo "draft_version_id={$versionId}\n";

if ($versionId) {
    $ver = json_decode($controller->showVersion(App\Domain\Factory\Models\WorkflowTemplateVersion::find($versionId))->getContent(), true);
    echo 'showVersion nodes=' . count($ver['definitionJson']['nodes'] ?? []) . "\n";
}
