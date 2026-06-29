<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Enums\WorkflowTimelineAction;
use App\Domain\Factory\Models\WorkflowInstance;
use App\Domain\Factory\Models\WorkflowTimelineEntry;
use Illuminate\Support\Facades\Auth;

class WorkflowTimelineService
{
    public function record(
        WorkflowInstance $instance,
        WorkflowTimelineAction $action,
        ?int $taskId = null,
        ?string $notes = null,
        ?array $meta = null,
    ): WorkflowTimelineEntry {
        return WorkflowTimelineEntry::query()->create([
            'instance_id' => $instance->id,
            'task_id' => $taskId,
            'action' => $action,
            'actor_id' => Auth::id(),
            'notes' => $notes,
            'meta' => $meta,
            'created_at' => now(),
        ]);
    }
}
