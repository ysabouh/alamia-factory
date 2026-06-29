<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Workflow;

use App\Application\Workflow\WorkflowDashboardService;
use App\Application\Workflow\WorkflowNotificationService;
use App\Domain\Factory\Models\WorkflowNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WorkflowDashboardController
{
    public function __construct(
        private readonly WorkflowDashboardService $dashboard,
        private readonly WorkflowNotificationService $notifications,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json($this->dashboard->metrics());
    }

    public function notifications(Request $request): JsonResponse
    {
        $userId = Auth::id();
        $q = WorkflowNotification::query()
            ->where('user_id', $userId)
            ->orderByDesc('created_at');

        if ($request->boolean('unreadOnly')) {
            $q->whereNull('read_at');
        }

        $rows = $q->limit(50)->get();

        return response()->json([
            'data' => $rows->map(fn ($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'message' => $n->message,
                'instanceId' => $n->instance_id,
                'taskId' => $n->task_id,
                'readAt' => $n->read_at?->toIso8601String(),
                'createdAt' => $n->created_at?->toIso8601String(),
            ])->values()->all(),
            'unreadCount' => WorkflowNotification::query()->where('user_id', $userId)->whereNull('read_at')->count(),
        ]);
    }

    public function markNotificationRead(WorkflowNotification $notification): JsonResponse
    {
        $this->notifications->markRead($notification->id);

        return response()->json(['ok' => true]);
    }
}
