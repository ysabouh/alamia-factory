<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

class MaintenanceTicketAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'maintenance_ticket';
    }

    public function modelClass(): string
    {
        return MaintenanceTicket::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'MAINTENANCE_REQUEST';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof MaintenanceTicket) {
            $instance->subject->update(['status' => 'resolved']);
        }
    }

    public function onWorkflowRejected(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof MaintenanceTicket) {
            $instance->subject->update(['status' => 'open']);
        }
    }

    public function subjectSummary(Model $subject): array
    {
        /** @var MaintenanceTicket $subject */
        return ['label' => $subject->title ?? 'طلب صيانة', 'code' => (string) $subject->id];
    }
}
