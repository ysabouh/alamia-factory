<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\HrRequest;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

class HrRequestAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'hr_request';
    }

    public function modelClass(): string
    {
        return HrRequest::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'HR_REQUEST';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof HrRequest) {
            $instance->subject->update(['status' => 'approved']);
        }
    }

    public function onWorkflowRejected(WorkflowInstance $instance): void
    {
        if ($instance->subject instanceof HrRequest) {
            $instance->subject->update(['status' => 'rejected']);
        }
    }

    public function subjectSummary(Model $subject): array
    {
        /** @var HrRequest $subject */
        return ['label' => $subject->title, 'code' => $subject->request_number];
    }
}
