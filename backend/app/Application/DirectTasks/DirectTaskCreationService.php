<?php

namespace App\Application\DirectTasks;

use App\Domain\Factory\Enums\DirectTaskType;
use App\Domain\Factory\Models\DirectTask;

class DirectTaskCreationService
{
    public function __construct(
        private readonly DirectTaskService $tasks,
        private readonly DirectTaskScheduleService $schedules,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): DirectTask
    {
        $taskType = DirectTaskType::from($data['taskType']);

        if ($taskType->isRecurring()) {
            return $this->schedules->createWithFirstTask($data);
        }

        return $this->tasks->createOneTime($data);
    }
}
