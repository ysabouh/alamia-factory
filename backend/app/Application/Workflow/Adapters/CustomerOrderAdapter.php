<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\CustomerOrder;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

class CustomerOrderAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'customer_order';
    }

    public function modelClass(): string
    {
        return CustomerOrder::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'CUSTOMER_ORDER';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof CustomerOrder) {
            $instance->subject->update(['status' => 'approved']);
        }
    }

    public function onWorkflowRejected(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof CustomerOrder) {
            $instance->subject->update(['status' => 'rejected']);
        }
    }

    public function subjectSummary(Model $subject): array
    {
        /** @var CustomerOrder $subject */
        return ['label' => 'طلب عميل', 'code' => (string) $subject->id];
    }
}
