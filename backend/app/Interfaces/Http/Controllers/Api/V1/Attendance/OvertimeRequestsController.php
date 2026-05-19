<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Attendance;

use App\Application\Attendance\OvertimeHoursCalculator;
use App\Application\Attendance\OvertimeWorkflowService;
use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\OvertimeRequest;
use App\Interfaces\Http\Support\SerializesAttendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OvertimeRequestsController
{
    use SerializesAttendance;

    public function __construct(
        private readonly OvertimeWorkflowService $workflow,
        private readonly MasterQuery $masterQuery,
        private readonly OvertimeHoursCalculator $hoursCalculator,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $recordScope = $request->query('recordScope', 'active');
        if (! in_array($recordScope, ['active', 'inactive', 'all'], true)) {
            $recordScope = 'active';
        }
        if (! $user?->can('overtime.delete') && $recordScope !== 'active') {
            $recordScope = 'active';
        }

        $q = OvertimeRequest::query()->with(['employee', 'statusLogs.actor', 'updatedBy', 'createdBy']);
        if ($recordScope === 'inactive') {
            $q->onlyTrashed();
        } elseif ($recordScope === 'all') {
            $q->withTrashed();
        }
        if ($request->filled('status')) {
            $q->where('status', $request->query('status'));
        }
        if ($request->filled('employeeId')) {
            $q->where('employee_id', $request->query('employeeId'));
        }
        if ($request->filled('from')) {
            $q->whereDate('overtime_date', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $q->whereDate('overtime_date', '<=', $request->query('to'));
        }

        $total = (clone $q)->count();
        $meta = $this->masterQuery->paginateMeta($request, $total);
        $rows = $q->orderByDesc('overtime_date')->forPage($meta['page'], $meta['pageSize'])->get();

        return response()->json([
            'data' => $rows->map(fn (OvertimeRequest $o) => $this->serializeOvertimeRequest($o))->values(),
            'meta' => array_merge($meta, [
                'overtimePolicy' => $this->hoursCalculator->policyForApi(),
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employeeId' => ['required', 'integer', 'exists:employees,id'],
            'overtimeDate' => ['required', 'date'],
            'startTime' => ['required', 'regex:/^([01]?\d|2[0-4]):([0-5]?\d|60)$/'],
            'endTime' => ['required', 'regex:/^([01]?\d|2[0-4]):([0-5]?\d|60)$/'],
            'reason' => ['nullable', 'string', 'max:2000'],
            'assignmentReason' => ['nullable', 'string', 'max:2000'],
            'supervisorId' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $ot = $this->workflow->create([
            'employeeId' => (int) $data['employeeId'],
            'overtimeDate' => $data['overtimeDate'],
            'startTime' => $this->hoursCalculator->normalizeTimeInput($data['startTime']),
            'endTime' => $this->hoursCalculator->normalizeTimeInput($data['endTime']),
            'reason' => $data['reason'] ?? null,
            'assignmentReason' => $data['assignmentReason'] ?? null,
            'supervisorId' => $data['supervisorId'] ?? null,
        ]);

        return response()->json(['data' => $this->serializeOvertimeRequest($ot)], 201);
    }

    public function update(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        $user = $request->user();
        if (! $user || (! $user->can('overtime.request') && ! $user->can('overtime.approve'))) {
            return response()->json(['message' => __('factory.unauthorized')], 403);
        }

        $data = $request->validate([
            'startTime' => ['sometimes', 'regex:/^([01]?\d|2[0-4]):([0-5]?\d|60)$/'],
            'endTime' => ['sometimes', 'regex:/^([01]?\d|2[0-4]):([0-5]?\d|60)$/'],
            'reason' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'assignmentReason' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        if (isset($data['startTime']) xor isset($data['endTime'])) {
            return response()->json(['message' => 'يجب إرسال وقت البداية والنهاية معاً.'], 422);
        }

        if (isset($data['startTime'])) {
            $data['startTime'] = $this->hoursCalculator->normalizeTimeInput($data['startTime']);
        }
        if (isset($data['endTime'])) {
            $data['endTime'] = $this->hoursCalculator->normalizeTimeInput($data['endTime']);
        }

        $canApprove = $user->can('overtime.approve');
        if ($canApprove && $overtimeRequest->status !== 'pending') {
            $ot = $this->workflow->recalculate($overtimeRequest, $data);
        } else {
            $ot = $this->workflow->updatePending($overtimeRequest, $data);
        }

        return response()->json(['data' => $this->serializeOvertimeRequest($ot)]);
    }

    public function approve(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => __('factory.unauthorized')], 401);
        }
        $data = $request->validate([
            'approvedHours' => ['sometimes', 'numeric', 'min:0', 'max:24'],
        ]);
        $ot = $this->workflow->approve($overtimeRequest, $user, isset($data['approvedHours']) ? (float) $data['approvedHours'] : null);

        return response()->json(['data' => $this->serializeOvertimeRequest($ot)]);
    }

    public function reject(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => __('factory.unauthorized')], 401);
        }
        $data = $request->validate([
            'rejectionReason' => ['required', 'string', 'max:2000'],
        ]);
        $ot = $this->workflow->reject($overtimeRequest, $user, $data['rejectionReason']);

        return response()->json(['data' => $this->serializeOvertimeRequest($ot)]);
    }

    public function complete(OvertimeRequest $overtimeRequest): JsonResponse
    {
        $ot = $this->workflow->complete($overtimeRequest);

        return response()->json(['data' => $this->serializeOvertimeRequest($ot)]);
    }

    public function destroy(OvertimeRequest $overtimeRequest): JsonResponse
    {
        $this->workflow->softDelete($overtimeRequest);

        return response()->json(['deleted' => true]);
    }
}
