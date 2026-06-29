<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\CustomerComplaint;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

class CustomerComplaintAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'customer_complaint';
    }

    public function modelClass(): string
    {
        return CustomerComplaint::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'CUSTOMER_COMPLAINT';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void
    {
        $this->updateStatus($instance, 'resolved');
    }

    public function onWorkflowRejected(WorkflowInstance $instance): void
    {
        $this->updateStatus($instance, 'rejected');
    }

    public function subjectSummary(Model $subject): array
    {
        /** @var CustomerComplaint $subject */
        return [
            'label' => $subject->title,
            'code' => $subject->request_number,
        ];
    }

    private function updateStatus(WorkflowInstance $instance, string $status): void
    {
        if ($instance->subject instanceof CustomerComplaint) {
            $instance->subject->update(['status' => $status]);
        }
    }
}
