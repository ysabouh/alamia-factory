"use client";

import { DirectTaskExecutionWorkspace } from "@/features/direct-tasks/detail/direct-task-execution-workspace";
import { DirectTasksListWorkspace } from "@/features/direct-tasks/direct-tasks-list-workspace";

export function DirectTaskDetailWorkspace({ taskId }: { taskId: number }) {
  return <DirectTaskExecutionWorkspace taskId={taskId} />;
}

export { DirectTasksListWorkspace };
