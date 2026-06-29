<?php

namespace App\Console\Commands;

use Database\Seeders\MaintenanceWorkflowSeeder;
use Illuminate\Console\Command;

class SeedMaintenanceWorkflowCommand extends Command
{
    protected $signature = 'factory:seed-maintenance-workflow
                            {--no-instance : إنشاء القالب فقط بدون بدء تنفيذ}
                            {--force : إعادة بناء الرسم ونشر نسخة جديدة}';

    protected $description = 'توليد قالب سير عمل طلب صيانة (MAINTENANCE_REQUEST) وبدء تنفيذ تجريبي';

    public function handle(): int
    {
        $seeder = new MaintenanceWorkflowSeeder;
        $result = $seeder->run(
            startInstance: ! $this->option('no-instance'),
            force: (bool) $this->option('force'),
        );

        $template = $result['template'];
        $this->info("قالب: {$template->name} ({$template->code}) — نسخة منشورة #{$template->published_version_id}");

        $stages = $template->publishedVersion?->stages ?? collect();
        $this->line('المراحل: '.$stages->pluck('name')->join(' → '));

        if ($result['ticket']) {
            $this->line("طلب صيانة: #{$result['ticket']->id} — {$result['ticket']->title}");
        }

        if ($result['instance']) {
            $inst = $result['instance'];
            $this->newLine();
            $this->info("تنفيذ: {$inst->workflow_number} — المرحلة: {$inst->currentStage?->name}");
            $this->line("رابط الواجهة: /myfactory/ar/workflow/instances/{$inst->id}");
        }

        return self::SUCCESS;
    }
}
