<?php

namespace App\Application\Workflow\Contracts;

use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

interface WorkflowSubjectAdapter
{
    public function subjectType(): string;

    public function modelClass(): string;

    public function defaultTemplateCode(): ?string;

    public function onWorkflowCompleted(WorkflowInstance $instance): void;

    public function onWorkflowRejected(WorkflowInstance $instance): void;

    /**
     * @return array{label: string, href?: string, code?: string}
     */
    public function subjectSummary(Model $subject): array;
}
