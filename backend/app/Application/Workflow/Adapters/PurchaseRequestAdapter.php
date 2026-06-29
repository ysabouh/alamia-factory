<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\PurchaseRequest;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequestAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'purchase_request';
    }

    public function modelClass(): string
    {
        return PurchaseRequest::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'PURCHASE_REQUEST';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof PurchaseRequest) {
            $instance->subject->update(['status' => 'approved']);
        }
    }

    public function onWorkflowRejected(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof PurchaseRequest) {
            $instance->subject->update(['status' => 'rejected']);
        }
    }

    public function subjectSummary(Model $subject): array
    {
        /** @var PurchaseRequest $subject */
        return ['label' => $subject->title, 'code' => $subject->request_number];
    }
}
