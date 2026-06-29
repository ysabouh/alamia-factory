<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

class MachineAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'machine';
    }

    public function modelClass(): string
    {
        return Machine::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'MACHINE_RECORD';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void {}

    public function onWorkflowRejected(WorkflowInstance $instance): void {}

    public function subjectSummary(Model $subject): array
    {
        /** @var Machine $subject */
        return ['label' => $subject->name, 'code' => $subject->code];
    }
}
