<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\InventoryTransfer;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

class InventoryTransferAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'inventory_transfer';
    }

    public function modelClass(): string
    {
        return InventoryTransfer::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'INVENTORY_TRANSFER';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof InventoryTransfer) {
            $instance->subject->update(['status' => 'completed']);
        }
    }

    public function onWorkflowRejected(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof InventoryTransfer) {
            $instance->subject->update(['status' => 'rejected']);
        }
    }

    public function subjectSummary(Model $subject): array
    {
        /** @var InventoryTransfer $subject */
        return ['label' => $subject->title, 'code' => $subject->request_number];
    }
}
