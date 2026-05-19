<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmploymentStatus;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class DailyAttendanceRosterService
{
    /** @var list<string> */
    private const EXCLUDED_EMPLOYMENT_CODES = ['TERMINATED', 'SUSPENDED', 'SUSP_REST'];

    /**
     * @param  array{search?:?string,departmentId?:?int,shiftId?:?int}  $filters
     * @return array{defaults: array<string, string>, rows: list<array<string, mixed>>, statistics: array<string, mixed>}
     */
    public function roster(CarbonInterface $date, array $filters = []): array
    {
        return $this->buildPayload($date, $filters);
    }

    /**
     * @param  array{search?:?string,departmentId?:?int,shiftId?:?int}  $filters
     * @return array<string, mixed>
     */
    public function statistics(CarbonInterface $date, array $filters = []): array
    {
        return $this->buildPayload($date, $filters)['statistics'];
    }

    /**
     * @param  array{search?:?string,departmentId?:?int,shiftId?:?int}  $filters
     * @return array{defaults: array<string, string>, rows: list<array<string, mixed>>, statistics: array<string, mixed>}
     */
    private function buildPayload(CarbonInterface $date, array $filters): array
    {
        $defaults = [
            'checkIn' => (string) config('factory.attendance.default_check_in', '08:00'),
            'checkOut' => (string) config('factory.attendance.default_check_out', '16:00'),
            'overtimeFrom' => (string) config('factory.attendance.default_overtime_from', '16:00'),
            'overtimeTo' => (string) config('factory.attendance.default_overtime_to', '19:00'),
            'dailyWorkMinutes' => AttendanceDefaults::defaultDailyWorkMinutes(),
            'dailyWorkHours' => round(AttendanceDefaults::defaultDailyWorkMinutes() / 60, 2),
        ];

        $employees = $this->eligibleEmployees($filters);
        $dateString = $date->toDateString();

        $records = AttendanceRecord::query()
            ->whereDate('attendance_date', $date)
            ->whereIn('employee_id', $employees->pluck('id'))
            ->get()
            ->keyBy('employee_id');

        $rows = $employees
            ->map(fn (Employee $employee) => $this->serializeRow(
                $employee,
                $records->get($employee->id),
                $dateString,
                $defaults
            ))
            ->values()
            ->all();

        return [
            'defaults' => $defaults,
            'rows' => $rows,
            'statistics' => $this->buildStatistics($dateString, $rows, $records),
        ];
    }

    /**
     * @param  array{search?:?string,departmentId?:?int,shiftId?:?int}  $filters
     * @return Collection<int, Employee>
     */
    private function eligibleEmployees(array $filters): Collection
    {
        $excludedStatusIds = EmploymentStatus::query()
            ->whereIn('code', self::EXCLUDED_EMPLOYMENT_CODES)
            ->pluck('id');

        $q = Employee::query()
            ->with(['organizationalDepartment', 'shift', 'employmentStatus'])
            ->where('is_active', true);

        if ($excludedStatusIds->isNotEmpty()) {
            $q->where(function ($w) use ($excludedStatusIds): void {
                $w->whereNull('employment_status_id')
                    ->orWhereNotIn('employment_status_id', $excludedStatusIds);
            });
        }

        if (! empty($filters['departmentId'])) {
            $q->where('department_id', $filters['departmentId']);
        }
        if (! empty($filters['shiftId'])) {
            $q->where('shift_id', $filters['shiftId']);
        }
        if (! empty($filters['search'])) {
            $s = '%'.$filters['search'].'%';
            $q->where(function ($w) use ($s): void {
                $w->where('employee_number', 'like', $s)
                    ->orWhere('first_name', 'like', $s)
                    ->orWhere('last_name', 'like', $s)
                    ->orWhere('name', 'like', $s);
            });
        }

        return $q->orderBy('employee_number')->get();
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  Collection<int|string, AttendanceRecord>  $records
     * @return array<string, mixed>
     */
    private function buildStatistics(string $dateString, array $rows, Collection $records): array
    {
        $present = 0;
        $late = 0;
        $absent = 0;
        $leave = 0;
        $paidLeave = 0;
        $unpaidLeave = 0;

        foreach ($rows as $row) {
            if ($row['isAbsent']) {
                $absent++;

                continue;
            }

            $status = $row['attendanceStatus'] ?? 'present';
            if ($status === 'late') {
                $late++;
            } elseif ($status === 'paid_leave') {
                $paidLeave++;
            } elseif ($status === 'unpaid_leave') {
                $unpaidLeave++;
            } elseif (in_array($status, ['leave', 'holiday', 'weekend'], true)) {
                $leave++;
            } elseif ($status === 'absent') {
                $absent++;
            } else {
                $present++;
            }
        }

        $leaveTotal = $leave + $paidLeave + $unpaidLeave;

        $recordList = $records->values();
        // لا تُحسب ساعات الإجازة المدفوعة ضمن إجمالي ساعات الدوام
        $totalWorkedMinutes = (int) collect($rows)
            ->reject(fn (array $row) => ($row['attendanceStatus'] ?? null) === 'paid_leave')
            ->sum('workedMinutes');

        return [
            'date' => $dateString,
            'totalEmployees' => count($rows),
            'present' => $present,
            'late' => $late,
            'absent' => $absent,
            'leave' => $leaveTotal,
            'paidLeave' => $paidLeave,
            'unpaidLeave' => $unpaidLeave,
            'payrollCostToday' => round((float) $recordList->sum('total_pay'), 2),
            'totalWorkedHours' => round($totalWorkedMinutes / 60, 2),
            'byStatus' => [
                'present' => $present,
                'late' => $late,
                'absent' => $absent,
                'leave' => $leaveTotal,
                'paid_leave' => $paidLeave,
                'unpaid_leave' => $unpaidLeave,
            ],
        ];
    }

    /**
     * @param  array<string, string>  $defaults
     * @return array<string, mixed>
     */
    private function serializeRow(Employee $employee, ?AttendanceRecord $record, string $date, array $defaults): array
    {
        $status = $record?->attendance_status;
        $isAbsent = $record === null || $status === 'absent';
        $isLeave = in_array($status, ['leave', 'paid_leave', 'unpaid_leave', 'holiday', 'weekend'], true);
        $timesLocked = $isAbsent || $isLeave;
        $workedMinutes = $isAbsent ? 0 : (int) ($record->worked_minutes ?? 0);
        $fullDayMinutes = (int) ($defaults['dailyWorkMinutes'] ?? AttendanceDefaults::defaultDailyWorkMinutes());
        $duty = $this->resolveDutyStatus($record, $isAbsent, $workedMinutes, $fullDayMinutes);

        return [
            'employeeId' => (string) $employee->id,
            'employeeNumber' => $employee->employee_number ?? '',
            'fullName' => trim(($employee->first_name ?? '').' '.($employee->last_name ?? '')) ?: ($employee->name ?? ''),
            'department' => $employee->organizationalDepartment?->name ?? $employee->department ?? '',
            'employmentStatusCode' => $employee->employmentStatus?->code,
            'recordId' => $record ? (string) $record->id : null,
            'attendanceDate' => $date,
            'checkIn' => $timesLocked ? null : ($this->timeFromDateTime($record?->check_in) ?? $defaults['checkIn']),
            'checkOut' => $timesLocked ? null : ($this->timeFromDateTime($record?->check_out) ?? $defaults['checkOut']),
            'attendanceStatus' => $status,
            'isAbsent' => $isAbsent,
            'isLeave' => $isLeave && ! $isAbsent,
            'leaveType' => $status === 'paid_leave' ? 'paid' : ($status === 'unpaid_leave' ? 'unpaid' : null),
            'workedMinutes' => $workedMinutes,
            'workedHours' => round($workedMinutes / 60, 2),
            'dutyStatus' => $duty['dutyStatus'],
            'dutyStatusLabel' => $duty['dutyStatusLabel'],
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

    private function timeFromDateTime(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return $value->format('H:i');
    }
}
