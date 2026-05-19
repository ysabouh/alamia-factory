<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\AttendanceActivityLog;
use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UpsertManualAttendanceService
{
    public function __construct(
        private readonly AttendanceCalculatorService $calculator,
        private readonly ResolveEmployeeShiftService $resolveShift,
    ) {}

    /**
     * @param  array{
     *   attendanceDate:string,
     *   action?:?string,
     *   checkIn?:?string,
     *   checkOut?:?string,
     *   overtimeFrom?:?string,
     *   attendanceStatus?:?string,
     *   notes?:?string
     * }  $data
     */
    public function handle(Employee $employee, array $data): AttendanceRecord
    {
        $action = $data['action'] ?? 'present';
        $date = Carbon::parse($data['attendanceDate'])->startOfDay();
        $shift = $this->resolveShift->resolve($employee, $date);
        $overtimeFromDefault = (string) config('factory.attendance.default_overtime_from', '16:00');

        if ($action === 'absent') {
            $calc = $this->calculator->calculate($employee, $date, null, null, $shift, 'absent');
            $record = $this->upsertRecord($employee, $date, array_merge($calc->toRecordAttributes(), [
                'check_in' => null,
                'check_out' => null,
                'overtime_from' => null,
                'worked_minutes' => 0,
                'notes' => $data['notes'] ?? null,
            ]));
            $this->logActivity($record, 'mark_absent', $data);

            return $record->load('employee');
        }

        if ($action === 'paid_leave' || $action === 'unpaid_leave') {
            $calc = $this->calculator->calculate($employee, $date, null, null, $shift, $action);
            $record = $this->upsertRecord($employee, $date, array_merge($calc->toRecordAttributes(), [
                'check_in' => null,
                'check_out' => null,
                'overtime_from' => null,
                'notes' => $data['notes'] ?? null,
            ]));
            $this->logActivity($record, $action, $data);

            return $record->load('employee');
        }

        $existing = AttendanceRecord::query()
            ->withTrashed()
            ->where('employee_id', $employee->id)
            ->whereDate('attendance_date', $date)
            ->first();

        if ($action === 'present') {
            $checkInTime = (string) config('factory.attendance.default_check_in', '08:00');
            $checkOutTime = (string) config('factory.attendance.default_check_out', '16:00');
        } else {
            $checkInTime = $this->normalizeTime($data['checkIn'] ?? null);
            $checkOutTime = $this->normalizeTime($data['checkOut'] ?? null);
        }

        if ($action === 'recalculate') {
            if ($checkInTime === null && $existing?->check_in) {
                $checkInTime = $existing->check_in->format('H:i');
            }
            if ($checkOutTime === null && $existing?->check_out) {
                $checkOutTime = $existing->check_out->format('H:i');
            }
        }

        if ($checkInTime === null) {
            $checkInTime = (string) config('factory.attendance.default_check_in', '08:00');
        }
        if ($checkOutTime === null) {
            $checkOutTime = (string) config('factory.attendance.default_check_out', '16:00');
        }

        $checkIn = Carbon::parse($data['attendanceDate'].' '.$checkInTime);
        $checkOut = Carbon::parse($data['attendanceDate'].' '.$checkOutTime);
        if ($checkOut->lessThanOrEqualTo($checkIn)) {
            $checkOut = $checkOut->copy()->addDay();
        }

        $overtimeFromTime = $this->normalizeTime($data['overtimeFrom'] ?? null) ?? $overtimeFromDefault;
        $overtimeFrom = Carbon::parse($data['attendanceDate'].' '.$overtimeFromTime);

        $calc = $this->calculator->calculate($employee, $date, $checkIn, $checkOut, $shift, null);
        $attrs = $calc->toRecordAttributes();

        if ($action === 'present') {
            $fullMinutes = AttendanceDefaults::defaultDailyWorkMinutes();
            $hourly = (float) $attrs['hourly_rate'];
            $attrs['attendance_status'] = 'present';
            $attrs['late_minutes'] = 0;
            $attrs['early_leave_minutes'] = 0;
            $attrs['worked_minutes'] = $fullMinutes;
            $attrs['regular_pay'] = round(($fullMinutes / 60) * $hourly, 2);
            $attrs['overtime_minutes'] = 0;
            $attrs['friday_overtime_minutes'] = 0;
            $attrs['overtime_pay'] = 0;
            $attrs['friday_overtime_pay'] = 0;
            $attrs['total_pay'] = $attrs['regular_pay'];
        } elseif ($checkOut->greaterThan($overtimeFrom)) {
            $attrs = $this->applyOvertimeFrom($attrs, $calc, $date, $overtimeFrom, $checkOut);
        }

        $record = $this->upsertRecord($employee, $date, array_merge($attrs, [
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'overtime_from' => $overtimeFrom->format('H:i:s'),
            'notes' => $data['notes'] ?? null,
        ]));

        $logAction = $action === 'recalculate' ? 'recalculate' : 'mark_present';
        $this->logActivity($record, $logAction, $data);

        return $record->load('employee');
    }

    /**
     * دمج ساعات إضافي فقط دون تسجيل دوام أساسي (جمعة أو يوم بلا حضور).
     */
    public function applyOvertimeOnly(
        Employee $employee,
        string $attendanceDate,
        int $extraMinutes,
        bool $isFriday,
        ?string $notes = null,
    ): AttendanceRecord {
        $date = Carbon::parse($attendanceDate)->startOfDay();
        $shift = $this->resolveShift->resolve($employee, $date);
        $forcedStatus = $isFriday ? 'weekend' : 'absent';
        $calc = $this->calculator->calculate($employee, $date, null, null, $shift, $forcedStatus);
        $attrs = $calc->toRecordAttributes();
        $attrs['check_in'] = null;
        $attrs['check_out'] = null;
        $attrs['overtime_from'] = null;
        $attrs['worked_minutes'] = 0;
        $attrs['regular_pay'] = 0;
        $attrs['late_minutes'] = 0;
        $attrs['early_leave_minutes'] = 0;
        $attrs['notes'] = $notes;

        if ($isFriday) {
            $attrs['friday_overtime_minutes'] = $extraMinutes;
            $attrs['friday_overtime_pay'] = round(($extraMinutes / 60) * $calc->fridayHourlyRate, 2);
            $attrs['overtime_minutes'] = 0;
            $attrs['overtime_pay'] = 0;
        } else {
            $attrs['overtime_minutes'] = $extraMinutes;
            $attrs['overtime_pay'] = round(($extraMinutes / 60) * $calc->overtimeHourlyRate, 2);
            $attrs['friday_overtime_minutes'] = 0;
            $attrs['friday_overtime_pay'] = 0;
        }

        $attrs['total_pay'] = round((float) $attrs['overtime_pay'] + (float) $attrs['friday_overtime_pay'], 2);

        $record = $this->upsertRecord($employee, $date, $attrs);
        $this->logActivity($record, 'overtime_only', ['extraMinutes' => $extraMinutes, 'isFriday' => $isFriday]);

        return $record->load('employee');
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function upsertRecord(Employee $employee, Carbon $date, array $values): AttendanceRecord
    {
        return DB::transaction(function () use ($employee, $date, $values): AttendanceRecord {
            $record = AttendanceRecord::query()
                ->withTrashed()
                ->where('employee_id', $employee->id)
                ->whereDate('attendance_date', $date)
                ->first();

            if ($record?->trashed()) {
                $record->restore();
            }

            if ($record) {
                $record->fill($values);
                $record->save();

                return $record;
            }

            return AttendanceRecord::query()->create(array_merge($values, [
                'employee_id' => $employee->id,
                'attendance_date' => $date->toDateString(),
            ]));
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function logActivity(AttendanceRecord $record, string $action, array $payload): void
    {
        try {
            AttendanceActivityLog::log(AttendanceRecord::class, (int) $record->id, $action, $payload);
        } catch (\Throwable) {
            // لا نمنع حفظ الحضور إذا فشل سجل النشاط
        }
    }

    private function normalizeTime(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $value = trim($value);
        if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $value, $m)) {
            return sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $attrs
     * @return array<string, mixed>
     */
    private function applyOvertimeFrom(
        array $attrs,
        \App\Application\Attendance\DTO\AttendanceCalculationResult $calc,
        Carbon $date,
        Carbon $overtimeFrom,
        Carbon $checkOut,
    ): array {
        $overtimeMinutes = (int) max(0, $overtimeFrom->diffInMinutes($checkOut));
        $fridayOvertimeMinutes = 0;

        if ($date->isFriday() && $overtimeMinutes > 0) {
            $fridayOvertimeMinutes = $overtimeMinutes;
            $overtimeMinutes = 0;
        }

        $attrs['overtime_minutes'] = $overtimeMinutes;
        $attrs['friday_overtime_minutes'] = $fridayOvertimeMinutes;
        $attrs['overtime_pay'] = round(($overtimeMinutes / 60) * $calc->overtimeHourlyRate, 2);
        $attrs['friday_overtime_pay'] = round(($fridayOvertimeMinutes / 60) * $calc->fridayHourlyRate, 2);
        $attrs['total_pay'] = round(
            (float) $attrs['regular_pay'] + (float) $attrs['overtime_pay'] + (float) $attrs['friday_overtime_pay'],
            2
        );

        return $attrs;
    }
}
