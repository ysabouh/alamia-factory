<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\SupplierRequest;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

class SupplierRequestAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'supplier_request';
    }

    public function modelClass(): string
    {
        return SupplierRequest::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'SUPPLIER_REQUEST';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof SupplierRequest) {
            $instance->subject->update(['status' => 'approved']);
        }
    }

    public function onWorkflowRejected(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof SupplierRequest) {
            $instance->subject->update(['status' => 'rejected']);
        }
    }

    public function subjectSummary(Model $subject): array
    {
        /** @var SupplierRequest $subject */
        return ['label' => $subject->title, 'code' => $subject->request_number];
    }
}
