<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Models\WorkflowAuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class WorkflowAuditLogger
{
    public function log(Model $model, string $action, ?array $oldValues = null, ?array $newValues = null): WorkflowAuditLog
    {
        return WorkflowAuditLog::query()->create([
            'auditable_type' => $model->getMorphClass(),
            'auditable_id' => $model->getKey(),
            'action' => $action,
            'actor_id' => Auth::id(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'created_at' => now(),
        ]);
    }
}
