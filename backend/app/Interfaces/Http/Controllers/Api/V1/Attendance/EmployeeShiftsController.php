<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Attendance;

use App\Application\Attendance\AssignEmployeeShiftService;
use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmployeeShift;
use App\Domain\Factory\Models\Shift;
use App\Interfaces\Http\Support\SerializesAttendance;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeShiftsController
{
    use SerializesAttendance;

    public function __construct(
        private readonly AssignEmployeeShiftService $assign,
        private readonly MasterQuery $masterQuery,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = EmployeeShift::query()->with(['employee', 'shift']);
        if ($request->filled('employeeId')) {
            $q->where('employee_id', $request->query('employeeId'));
        }
        if ($request->boolean('activeOnly')) {
            $q->where('is_active', true);
        }

        $total = (clone $q)->count();
        $meta = $this->masterQuery->paginateMeta($request, $total);
        $rows = $q->orderByDesc('effective_from')->forPage($meta['page'], $meta['pageSize'])->get();

        return response()->json([
            'data' => $rows->map(fn (EmployeeShift $es) => $this->serializeEmployeeShift($es))->values(),
            'meta' => $meta,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employeeId' => ['required', 'integer', 'exists:employees,id'],
            'shiftId' => ['required', 'integer', 'exists:shifts,id'],
            'effectiveFrom' => ['required', 'date'],
            'effectiveTo' => ['nullable', 'date', 'after_or_equal:effectiveFrom'],
        ]);

        $employee = Employee::query()->findOrFail($data['employeeId']);
        $shift = Shift::query()->findOrFail($data['shiftId']);
        $assignment = $this->assign->handle(
            $employee,
            $shift,
            Carbon::parse($data['effectiveFrom']),
            ! empty($data['effectiveTo']) ? Carbon::parse($data['effectiveTo']) : null,
        );

        return response()->json(['data' => $this->serializeEmployeeShift($assignment)], 201);
    }
}
