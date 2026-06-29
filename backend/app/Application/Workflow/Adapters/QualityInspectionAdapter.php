<?php

namespace App\Application\Workflow\Adapters;

use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\QualityInspection;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;

class QualityInspectionAdapter implements WorkflowSubjectAdapter
{
    public function subjectType(): string
    {
        return 'quality_inspection';
    }

    public function modelClass(): string
    {
        return QualityInspection::class;
    }

    public function defaultTemplateCode(): ?string
    {
        return 'QUALITY_INSPECTION';
    }

    public function onWorkflowCompleted(WorkflowInstance $instance): void {}

    public function onWorkflowRejected(WorkflowInstance $instance): void {}

    public function subjectSummary(Model $subject): array
    {
        /** @var QualityInspection $subject */
        return ['label' => 'فحص جودة', 'code' => (string) $subject->id];
    }
}
