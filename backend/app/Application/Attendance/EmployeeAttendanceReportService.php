<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\OvertimeRequest;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class EmployeeAttendanceReportService
{
    public function __construct(
        private readonly OvertimeHoursCalculator $overtimeHoursCalculator,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(Employee $employee, CarbonInterface $from, CarbonInterface $to): array
    {
        $fromDate = $from->copy()->startOfDay();
        $toDate = $to->copy()->startOfDay();
        if ($fromDate->gt($toDate)) {
            [$fromDate, $toDate] = [$toDate, $fromDate];
        }

        $employee->loadMissing(['organizationalDepartment', 'shift']);

        $records = AttendanceRecord::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('attendance_date', [$fromDate->toDateString(), $toDate->toDateString()])
            ->orderBy('attendance_date')
            ->get()
            ->keyBy(fn (AttendanceRecord $r) => $r->attendance_date?->toDateString() ?? '');

        $overtimeRows = OvertimeRequest::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('overtime_date', [$fromDate->toDateString(), $toDate->toDateString()])
            ->whereNull('deleted_at')
            ->orderBy('overtime_date')
            ->get()
            ->keyBy(fn (OvertimeRequest $o) => $o->overtime_date?->toDateString() ?? '');

        $fullDayMinutes = AttendanceDefaults::defaultDailyWorkMinutes();
        $days = [];
        $totalWorkedMinutes = 0;
        $totalOvertimeDuration = 0.0;
        $totalOvertimeWeighted = 0.0;

        for ($cursor = $fromDate->copy(); $cursor->lte($toDate); $cursor->addDay()) {
            $dateString = $cursor->toDateString();
            /** @var AttendanceRecord|null $record */
            $record = $records->get($dateString);
            /** @var OvertimeRequest|null $overtime */
            $overtime = $overtimeRows->get($dateString);

            $attendancePayload = $record ? $this->serializeAttendanceDay($record, $fullDayMinutes) : null;
            $overtimePayload = $overtime ? $this->serializeOvertimeDay($overtime) : null;

            if ($attendancePayload) {
                $totalWorkedMinutes += (int) ($attendancePayload['workedMinutes'] ?? 0);
            }
            if ($overtimePayload) {
                $totalOvertimeDuration += (float) ($overtimePayload['durationHours'] ?? 0);
                $totalOvertimeWeighted += (float) ($overtimePayload['weightedHours'] ?? 0);
            }

            $days[] = [
                'date' => $dateString,
                'attendance' => $attendancePayload,
                'overtime' => $overtimePayload,
            ];
        }

        return [
            'employee' => [
                'id' => (string) $employee->id,
                'employeeNumber' => $employee->employee_number ?? '',
                'fullName' => trim(($employee->first_name ?? '').' '.($employee->last_name ?? '')) ?: ($employee->name ?? ''),
                'department' => $employee->organizationalDepartment?->name ?? $employee->department ?? '',
            ],
            'from' => $fromDate->toDateString(),
            'to' => $toDate->toDateString(),
            'days' => $days,
            'summary' => [
                'dayCount' => count($days),
                'daysWithAttendance' => $records->count(),
                'daysWithOvertime' => $overtimeRows->count(),
                'totalWorkedMinutes' => $totalWorkedMinutes,
                'totalWorkedHours' => round($totalWorkedMinutes / 60, 2),
                'totalOvertimeDurationHours' => round($totalOvertimeDuration, 2),
                'totalOvertimeWeightedHours' => round($totalOvertimeWeighted, 2),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeAttendanceDay(AttendanceRecord $record, int $fullDayMinutes): array
    {
        $status = $record->attendance_status;
        $isAbsent = $status === 'absent';
        $isLeave = in_array($status, ['leave', 'paid_leave', 'unpaid_leave', 'holiday', 'weekend'], true);
        $timesLocked = $isAbsent || $isLeave;
        $workedMinutes = $isAbsent ? 0 : (int) ($record->worked_minutes ?? 0);
        $duty = $this->resolveDutyStatus($record, $isAbsent, $workedMinutes, $fullDayMinutes);

        return [
            'recordId' => (string) $record->id,
            'checkIn' => $timesLocked ? null : $this->formatTime($record->check_in),
            'checkOut' => $timesLocked ? null : $this->formatTime($record->check_out),
            'overtimeFrom' => $this->formatTime($record->overtime_from),
            'attendanceStatus' => $status,
            'workedMinutes' => $workedMinutes,
            'workedHours' => round($workedMinutes / 60, 2),
            'overtimeMinutes' => (int) ($record->overtime_minutes ?? 0),
            'fridayOvertimeMinutes' => (int) ($record->friday_overtime_minutes ?? 0),
            'dutyStatus' => $duty['dutyStatus'],
            'dutyStatusLabel' => $duty['dutyStatusLabel'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeOvertimeDay(OvertimeRequest $request): array
    {
        $date = $request->overtime_date?->toDateString() ?? '';
        $start = $request->start_time ? Carbon::parse($request->start_time)->format('H:i') : '';
        $end = $request->end_time ? Carbon::parse($request->end_time)->format('H:i') : '';
        $duration = (float) $request->duration_hours;
        $weighted = (float) $request->weighted_hours;
        $multiplier = $request->rate_multiplier !== null ? (float) $request->rate_multiplier : null;

        if ($date && $start && $end && ($duration <= 0 || $weighted <= 0 || $multiplier === null)) {
            $computed = $this->overtimeHoursCalculator->compute($date, $start, $end);
            $duration = $duration > 0 ? $duration : $computed['durationHours'];
            $weighted = $weighted > 0 ? $weighted : $computed['weightedHours'];
            $multiplier = $multiplier ?? $computed['rateMultiplier'];
        }
        $multiplier ??= $date ? $this->overtimeHoursCalculator->multiplierForDate($date) : $this->overtimeHoursCalculator->weekdayMultiplier();

        return [
            'id' => (string) $request->id,
            'startTime' => $start,
            'endTime' => $end,
            'durationHours' => $duration,
            'weightedHours' => $weighted,
            'rateMultiplier' => $multiplier,
            'multiplierLabel' => $this->overtimeHoursCalculator->multiplierLabel($multiplier),
            'status' => $request->status,
            'assignmentReason' => $request->assignment_reason,
        ];
    }

    /**
     * @return array{dutyStatus: string, dutyStatusLabel: string}
     */
    private function resolveDutyStatus(?AttendanceRecord $record, bool $isAbsent, int $workedMinutes, int $fullDayMinutes): array
    {
        if ($isAbsent) {
            return ['dutyStatus' => 'absent', 'dutyStatusLabel' => 'غياب'];
        }

        $status = $record?->attendance_status;

        if ($status === 'paid_leave') {
            return ['dutyStatus' => 'paid_leave', 'dutyStatusLabel' => 'مدفوعة'];
        }

        if ($status === 'unpaid_leave') {
            return ['dutyStatus' => 'unpaid_leave', 'dutyStatusLabel' => 'غير مدفوعة'];
        }

        if (in_array($status, ['present', 'remote', 'mission'], true)) {
            return ['dutyStatus' => 'present', 'dutyStatusLabel' => 'حضور'];
        }

        if ($status === 'late' || ($workedMinutes > 0 && $workedMinutes < $fullDayMinutes)) {
            return ['dutyStatus' => 'late', 'dutyStatusLabel' => 'متأخر'];
        }

        return ['dutyStatus' => 'present', 'dutyStatusLabel' => 'حضور'];
    }

    private function formatTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if ($value instanceof \DateTimeInterface) {
            return $value->format('H:i');
        }

        $str = (string) $value;

        return strlen($str) >= 5 ? substr($str, 0, 5) : $str;
    }
}
