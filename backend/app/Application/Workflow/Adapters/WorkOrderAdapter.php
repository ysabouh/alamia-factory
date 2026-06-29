<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\WorkflowInstance;
use App\Domain\Factory\Models\WorkOrder;
use Illuminate\Database\Eloquent\Model;

class WorkOrderAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'work_order';
    }

    public function modelClass(): string
    {
        return WorkOrder::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'PRODUCTION_ORDER';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void {}

    public function onWorkflowRejected(WorkflowInstance $instance): void {}

    public function subjectSummary(Model $subject): array
    {
        /** @var WorkOrder $subject */
        return [
            'label' => 'أمر إنتاج',
            'code' => $subject->order_no ?? $subject->code,
        ];
    }
}
