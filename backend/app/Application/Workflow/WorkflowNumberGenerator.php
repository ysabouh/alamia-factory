<?php

namespace App\Application\Workflow;

use Illuminate\Database\Eloquent\Model;

class WorkflowNumberGenerator
{
    public function nextWorkflowNumber(): string
    {
        return $this->nextNumber('WF', \App\Domain\Factory\Models\WorkflowInstance::class, 'workflow_number');
    }

    public function nextTaskNumber(): string
    {
        return $this->nextNumber('WT', \App\Domain\Factory\Models\WorkflowTask::class, 'task_number');
    }

    public function nextRequestNumber(string $prefix): string
    {
        return $this->nextNumber($prefix, null, null);
    }

    private function nextNumber(string $prefix, ?string $modelClass, ?string $column): string
    {
        $year = now()->format('Y');
        $fullPrefix = "{$prefix}-{$year}-";

        if ($modelClass !== null && $column !== null) {
            $last = $modelClass::query()
                ->where($column, 'like', $fullPrefix.'%')
                ->orderByDesc($column)
                ->value($column);

            $seq = 1;
            if (is_string($last) && preg_match('/-(\d+)$/', $last, $m)) {
                $seq = (int) $m[1] + 1;
            }

            return $fullPrefix.str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
        }

        return $fullPrefix.str_pad((string) random_int(1, 99999), 5, '0', STR_PAD_LEFT);
    }
}
