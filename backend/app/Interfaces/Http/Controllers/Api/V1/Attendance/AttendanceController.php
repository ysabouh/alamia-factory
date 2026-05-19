<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Attendance;

use App\Application\Attendance\ApproveAttendanceService;
use App\Application\Attendance\DailyAttendanceRosterService;
use App\Application\Attendance\EmployeeAttendanceReportService;
use App\Application\Attendance\RecordCheckInService;
use App\Application\Attendance\RecordCheckOutService;
use App\Application\Attendance\UpsertManualAttendanceService;
use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Repositories\AttendanceRecordRepository;
use App\Interfaces\Http\Support\SerializesAttendance;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController
{
    use SerializesAttendance;

    public function __construct(
        private readonly AttendanceRecordRepository $records,
        private readonly DailyAttendanceRosterService $dailyRoster,
        private readonly RecordCheckInService $checkIn,
        private readonly RecordCheckOutService $checkOut,
        private readonly UpsertManualAttendanceService $manual,
        private readonly ApproveAttendanceService $approve,
        private readonly EmployeeAttendanceReportService $attendanceReportService,
    ) {}

    public function daily(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
            'search' => ['sometimes', 'string', 'max:120'],
            'departmentId' => ['sometimes', 'integer'],
            'shiftId' => ['sometimes', 'integer'],
        ]);

        $date = Carbon::parse($request->query('date'));
        $payload = $this->dailyRoster->roster($date, [
            'search' => $request->query('search'),
            'departmentId' => $request->query('departmentId'),
            'shiftId' => $request->query('shiftId'),
        ]);

        return response()->json(['data' => $payload]);
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'pageSize' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'search' => ['sometimes', 'string', 'max:120'],
            'departmentId' => ['sometimes', 'integer'],
            'shiftId' => ['sometimes', 'integer'],
            'status' => ['sometimes', 'string'],
        ]);

        $date = Carbon::parse($request->query('date'));
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = max(1, min(100, (int) $request->query('pageSize', 20)));

        $paginator = $this->records->paginateForDate($date, [
            'search' => $request->query('search'),
            'departmentId' => $request->query('departmentId'),
            'shiftId' => $request->query('shiftId'),
            'status' => $request->query('status'),
        ], $page, $pageSize);

        return response()->json([
            'data' => collect($paginator->items())->map(fn (AttendanceRecord $r) => $this->serializeAttendanceRecord($r))->values(),
            'meta' => [
                'page' => $paginator->currentPage(),
                'pageSize' => $paginator->perPage(),
                'total' => $paginator->total(),
                'totalPages' => $paginator->lastPage(),
            ],
        ]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['sometimes', 'date'],
            'search' => ['sometimes', 'string', 'max:120'],
            'departmentId' => ['sometimes', 'integer'],
            'shiftId' => ['sometimes', 'integer'],
        ]);

        $date = Carbon::parse($request->query('date', now()->toDateString()));

        return response()->json([
            'data' => $this->dailyRoster->statistics($date, [
                'search' => $request->query('search'),
                'departmentId' => $request->query('departmentId'),
                'shiftId' => $request->query('shiftId'),
            ]),
        ]);
    }

    public function employeeHistory(Employee $employee, Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['sometimes', 'date'],
            'to' => ['sometimes', 'date'],
        ]);

        $from = Carbon::parse($data['from'] ?? now()->subDays(30)->toDateString());
        $to = Carbon::parse($data['to'] ?? now()->toDateString());
        if ($from->diffInDays($to) > 92) {
            return response()->json(['message' => 'الفترة القصوى 92 يوماً.'], 422);
        }

        $rows = $this->records->forEmployeeBetween($employee->id, $from, $to);

        return response()->json([
            'data' => $rows->map(fn (AttendanceRecord $r) => $this->serializeAttendanceRecord($r))->values(),
        ]);
    }

    public function employeeReport(Employee $employee, Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
        ]);

        $from = Carbon::parse($data['from']);
        $to = Carbon::parse($data['to']);
        if ($from->diffInDays($to) > 92) {
            return response()->json(['message' => 'الفترة القصوى 92 يوماً.'], 422);
        }

        return response()->json([
            'data' => $this->attendanceReportService->build($employee, $from, $to),
        ]);
    }

    public function checkIn(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employeeId' => ['required', 'integer', 'exists:employees,id'],
            'at' => ['sometimes', 'date'],
        ]);
        $employee = Employee::query()->findOrFail($data['employeeId']);
        $at = isset($data['at']) ? Carbon::parse($data['at']) : null;
        $record = $this->checkIn->handle($employee, $at);

        return response()->json(['data' => $this->serializeAttendanceRecord($record)]);
    }

    public function checkOut(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employeeId' => ['required', 'integer', 'exists:employees,id'],
            'at' => ['sometimes', 'date'],
        ]);
        $employee = Employee::query()->findOrFail($data['employeeId']);
        $at = isset($data['at']) ? Carbon::parse($data['at']) : null;

        try {
            $record = $this->checkOut->handle($employee, $at);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeAttendanceRecord($record)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employeeId' => ['required', 'integer', 'exists:employees,id'],
            'attendanceDate' => ['required', 'date'],
            'action' => ['sometimes', 'in:present,absent,recalculate,paid_leave,unpaid_leave'],
            'checkIn' => ['nullable', 'regex:/^\d{1,2}:\d{2}(:\d{2})?$/'],
            'checkOut' => ['nullable', 'regex:/^\d{1,2}:\d{2}(:\d{2})?$/'],
            'overtimeFrom' => ['nullable', 'regex:/^\d{1,2}:\d{2}(:\d{2})?$/'],
            'attendanceStatus' => ['nullable', 'in:present,absent,late,leave,paid_leave,unpaid_leave,holiday,weekend,remote,mission'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $employee = Employee::query()->findOrFail($data['employeeId']);
        $record = $this->manual->handle($employee, [
            'attendanceDate' => $data['attendanceDate'],
            'action' => $data['action'] ?? ($data['attendanceStatus'] === 'absent' ? 'absent' : 'present'),
            'checkIn' => $data['checkIn'] ?? null,
            'checkOut' => $data['checkOut'] ?? null,
            'overtimeFrom' => $data['overtimeFrom'] ?? null,
            'attendanceStatus' => $data['attendanceStatus'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(['data' => $this->serializeAttendanceRecord($record)], 201);
    }

    public function approve(Request $request, AttendanceRecord $record): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => __('factory.unauthorized')], 401);
        }
        $record = $this->approve->handle($record, $user);

        return response()->json(['data' => $this->serializeAttendanceRecord($record)]);
    }
}
