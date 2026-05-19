<?php

namespace App\Interfaces\Http\Support;

use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\EmployeeShift;
use App\Domain\Factory\Models\OvertimeRequest;
use App\Domain\Factory\Models\Payroll;
use App\Domain\Factory\Models\PayrollItem;
use Illuminate\Support\Carbon;

trait SerializesAttendance
{
    private function formatTimeOnly(mixed $value): ?string
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

    /**
     * @return array<string, mixed>
     */
    protected function serializeAttendanceRecord(AttendanceRecord $r): array
    {
        $employee = $r->relationLoaded('employee') ? $r->employee : null;

        return [
            'id' => (string) $r->id,
            'employeeId' => (string) $r->employee_id,
            'employeeNumber' => $employee?->employee_number ?? '',
            'fullName' => $employee?->full_name ?? '',
            'department' => $employee?->organizationalDepartment?->name ?? $employee?->department ?? '',
            'shift' => $employee?->shift?->name ?? '',
            'attendanceDate' => $r->attendance_date?->toDateString(),
            'checkIn' => $r->check_in?->toIso8601String(),
            'checkOut' => $r->check_out?->toIso8601String(),
            'overtimeFrom' => $this->formatTimeOnly($r->overtime_from),
            'workedMinutes' => (int) $r->worked_minutes,
            'overtimeMinutes' => (int) $r->overtime_minutes,
            'fridayOvertimeMinutes' => (int) $r->friday_overtime_minutes,
            'lateMinutes' => (int) $r->late_minutes,
            'earlyLeaveMinutes' => (int) $r->early_leave_minutes,
            'attendanceStatus' => $r->attendance_status,
            'hourlyRate' => (float) $r->hourly_rate,
            'overtimeHourlyRate' => (float) $r->overtime_hourly_rate,
            'fridayHourlyRate' => (float) $r->friday_hourly_rate,
            'regularPay' => (float) $r->regular_pay,
            'overtimePay' => (float) $r->overtime_pay,
            'fridayOvertimePay' => (float) $r->friday_overtime_pay,
            'totalPay' => (float) $r->total_pay,
            'approvedAt' => $r->approved_at?->toIso8601String(),
            'approvedBySupervisorId' => $r->approved_by_supervisor_id ? (string) $r->approved_by_supervisor_id : null,
            'notes' => $r->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeOvertimeRequest(OvertimeRequest $o): array
    {
        $employee = $o->relationLoaded('employee') ? $o->employee : null;
        $updatedBy = $o->relationLoaded('updatedBy') ? $o->updatedBy : null;
        $calc = app(\App\Application\Attendance\OvertimeHoursCalculator::class);
        $date = $o->overtime_date?->toDateString() ?? '';
        $start = $o->start_time ? \Carbon\Carbon::parse($o->start_time)->format('H:i') : '';
        $end = $o->end_time ? \Carbon\Carbon::parse($o->end_time)->format('H:i') : '';
        $duration = (float) $o->duration_hours;
        $weighted = (float) $o->weighted_hours;
        $multiplier = $o->rate_multiplier !== null ? (float) $o->rate_multiplier : null;
        if ($date && $start && $end && ($duration <= 0 || $weighted <= 0 || $multiplier === null)) {
            $computed = $calc->compute($date, $start, $end);
            $duration = $duration > 0 ? $duration : $computed['durationHours'];
            $weighted = $weighted > 0 ? $weighted : $computed['weightedHours'];
            $multiplier = $multiplier ?? $computed['rateMultiplier'];
        }
        $multiplier ??= $date ? $calc->multiplierForDate($date) : $calc->weekdayMultiplier();

        return [
            'id' => (string) $o->id,
            'employeeId' => (string) $o->employee_id,
            'employeeNumber' => $employee?->employee_number ?? '',
            'fullName' => $employee?->full_name ?? '',
            'supervisorId' => $o->supervisor_id ? (string) $o->supervisor_id : null,
            'overtimeDate' => $o->overtime_date?->toDateString(),
            'startTime' => $start,
            'endTime' => $end,
            'durationHours' => $duration,
            'weightedHours' => $weighted,
            'rateMultiplier' => $multiplier,
            'multiplierLabel' => $calc->multiplierLabel($multiplier),
            'approvedHours' => (float) $o->approved_hours,
            'reason' => $o->reason,
            'assignmentReason' => $o->assignment_reason,
            'status' => $o->status,
            'approvedAt' => $o->approved_at?->toIso8601String(),
            'rejectedAt' => $o->rejected_at?->toIso8601String(),
            'rejectionReason' => $o->rejection_reason,
            'updatedAt' => $o->updated_date?->toIso8601String(),
            'updatedByName' => $updatedBy?->name ?? $updatedBy?->email,
            'isActive' => $o->deleted_at === null,
            'deletedAt' => $o->deleted_at?->toIso8601String(),
            'statusLogs' => $o->relationLoaded('statusLogs')
                ? $o->statusLogs->map(fn ($log) => $this->serializeOvertimeStatusLog($log))->values()->all()
                : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeOvertimeStatusLog(\App\Domain\Factory\Models\OvertimeRequestStatusLog $log): array
    {
        $actor = $log->relationLoaded('actor') ? $log->actor : null;

        return [
            'id' => (string) $log->id,
            'action' => $log->action,
            'fromStatus' => $log->from_status,
            'toStatus' => $log->to_status,
            'actorName' => $actor?->name ?? $actor?->email,
            'assignmentReason' => $log->assignment_reason,
            'rejectionReason' => $log->rejection_reason,
            'note' => $log->note,
            'changes' => $log->changes,
            'createdAt' => $log->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializePayroll(Payroll $p): array
    {
        return [
            'id' => (string) $p->id,
            'year' => (int) $p->year,
            'month' => (int) $p->month,
            'status' => $p->status,
            'periodStart' => $p->period_start?->toDateString(),
            'periodEnd' => $p->period_end?->toDateString(),
            'totalRegularPay' => (float) $p->total_regular_pay,
            'totalOvertimePay' => (float) $p->total_overtime_pay,
            'totalFridayOvertimePay' => (float) $p->total_friday_overtime_pay,
            'totalAmount' => (float) $p->total_amount,
            'generatedAt' => $p->generated_at?->toIso8601String(),
            'items' => $p->relationLoaded('items')
                ? $p->items->map(fn (PayrollItem $i) => $this->serializePayrollItem($i))->values()->all()
                : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializePayrollItem(PayrollItem $i): array
    {
        $employee = $i->relationLoaded('employee') ? $i->employee : null;

        return [
            'id' => (string) $i->id,
            'employeeId' => (string) $i->employee_id,
            'employeeNumber' => $employee?->employee_number ?? '',
            'fullName' => $employee?->full_name ?? '',
            'daysPresent' => (int) $i->days_present,
            'daysAbsent' => (int) $i->days_absent,
            'totalWorkedMinutes' => (int) $i->total_worked_minutes,
            'totalOvertimeMinutes' => (int) $i->total_overtime_minutes,
            'totalFridayOvertimeMinutes' => (int) $i->total_friday_overtime_minutes,
            'regularPay' => (float) $i->regular_pay,
            'overtimePay' => (float) $i->overtime_pay,
            'fridayOvertimePay' => (float) $i->friday_overtime_pay,
            'totalPay' => (float) $i->total_pay,
            'snapshotJson' => $i->snapshot_json,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeEmployeeShift(EmployeeShift $es): array
    {
        return [
            'id' => (string) $es->id,
            'employeeId' => (string) $es->employee_id,
            'shiftId' => (string) $es->shift_id,
            'shiftName' => $es->shift?->name ?? '',
            'effectiveFrom' => $es->effective_from?->toDateString(),
            'effectiveTo' => $es->effective_to?->toDateString(),
            'isActive' => (bool) $es->is_active,
        ];
    }
}
