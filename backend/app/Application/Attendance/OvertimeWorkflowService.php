<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\OvertimeRequest;
use App\Domain\Factory\Models\OvertimeRequestStatusLog;
use App\Domain\Factory\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OvertimeWorkflowService
{
    public function __construct(
        private readonly UpsertManualAttendanceService $manualAttendance,
        private readonly OvertimeHoursCalculator $hoursCalculator,
    ) {}

    /**
     * @param  array{
     *   employeeId:int,
     *   overtimeDate:string,
     *   startTime:string,
     *   endTime:string,
     *   reason?:?string,
     *   assignmentReason?:?string,
     *   supervisorId?:?int
     * }  $data
     */
    public function create(array $data): OvertimeRequest
    {
        [$start, $end] = $this->hoursCalculator->parseWindow($data['overtimeDate'], $data['startTime'], $data['endTime']);
        $hours = $this->hoursCalculator->compute($data['overtimeDate'], $data['startTime'], $data['endTime']);

        $duplicate = OvertimeRequest::query()
            ->where('employee_id', $data['employeeId'])
            ->whereDate('overtime_date', $data['overtimeDate'])
            ->whereIn('status', ['pending', 'approved', 'completed'])
            ->whereNull('deleted_at')
            ->exists();
        if ($duplicate) {
            throw ValidationException::withMessages([
                'employeeId' => ['هذا الموظف لديه طلب إضافي في هذا اليوم مسبقاً.'],
            ]);
        }

        $request = OvertimeRequest::query()->create([
            'employee_id' => $data['employeeId'],
            'supervisor_id' => $data['supervisorId'] ?? null,
            'overtime_date' => $data['overtimeDate'],
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'duration_hours' => $hours['durationHours'],
            'weighted_hours' => $hours['weightedHours'],
            'rate_multiplier' => $hours['rateMultiplier'],
            'approved_hours' => 0,
            'reason' => $data['reason'] ?? null,
            'assignment_reason' => $data['assignmentReason'] ?? null,
            'status' => 'pending',
        ]);

        $this->logStatus(
            $request,
            action: 'created',
            fromStatus: null,
            toStatus: 'pending',
            assignmentReason: $data['assignmentReason'] ?? null,
            note: $data['reason'] ?? null,
            changes: [
                'startTime' => $start->format('H:i'),
                'endTime' => $end->format('H:i'),
                'durationHours' => $hours['durationHours'],
                'weightedHours' => $hours['weightedHours'],
                'rateMultiplier' => $hours['rateMultiplier'],
            ],
        );

        return $request->load(['employee', 'statusLogs.actor', 'updatedBy']);
    }

    /**
     * @param  array{
     *   startTime?:?string,
     *   endTime?:?string,
     *   reason?:?string,
     *   assignmentReason?:?string
     * }  $data
     */
    public function updatePending(OvertimeRequest $request, array $data): OvertimeRequest
    {
        if ($request->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['لا يمكن تعديل طلب ليس قيد الانتظار.'],
            ]);
        }

        $changes = [];
        $payload = [];

        if (isset($data['startTime'], $data['endTime'])) {
            $date = $request->overtime_date->format('Y-m-d');
            [$start, $end] = $this->hoursCalculator->parseWindow($date, $data['startTime'], $data['endTime']);
            $hours = $this->hoursCalculator->compute($date, $data['startTime'], $data['endTime']);
            $payload['start_time'] = $start->format('H:i:s');
            $payload['end_time'] = $end->format('H:i:s');
            $payload['duration_hours'] = $hours['durationHours'];
            $payload['weighted_hours'] = $hours['weightedHours'];
            $payload['rate_multiplier'] = $hours['rateMultiplier'];
            $changes['startTime'] = ['from' => Carbon::parse($request->start_time)->format('H:i'), 'to' => $start->format('H:i')];
            $changes['endTime'] = ['from' => Carbon::parse($request->end_time)->format('H:i'), 'to' => $end->format('H:i')];
            $changes['durationHours'] = ['from' => (float) $request->duration_hours, 'to' => $hours['durationHours']];
            $changes['weightedHours'] = ['from' => (float) $request->weighted_hours, 'to' => $hours['weightedHours']];
        }

        if (array_key_exists('reason', $data)) {
            $payload['reason'] = $data['reason'];
            $changes['reason'] = ['from' => $request->reason, 'to' => $data['reason']];
        }

        if (array_key_exists('assignmentReason', $data)) {
            $payload['assignment_reason'] = $data['assignmentReason'];
            $changes['assignmentReason'] = ['from' => $request->assignment_reason, 'to' => $data['assignmentReason']];
        }

        if ($payload === []) {
            return $request->load(['employee', 'statusLogs.actor', 'updatedBy']);
        }

        $request->update($payload);

        $this->logStatus(
            $request,
            action: 'updated',
            fromStatus: 'pending',
            toStatus: 'pending',
            assignmentReason: $data['assignmentReason'] ?? $request->assignment_reason,
            note: 'تعديل بيانات الطلب',
            changes: $changes,
        );

        return $request->fresh(['employee', 'statusLogs.actor', 'updatedBy']);
    }

    /**
     * إعادة حساب الساعات — للمدير على أي حالة.
     *
     * @param  array{
     *   startTime?:?string,
     *   endTime?:?string,
     *   assignmentReason?:?string
     * }  $data
     */
    public function recalculate(OvertimeRequest $request, array $data): OvertimeRequest
    {
        $date = $request->overtime_date->format('Y-m-d');
        $startTime = $data['startTime'] ?? Carbon::parse($request->start_time)->format('H:i');
        $endTime = $data['endTime'] ?? Carbon::parse($request->end_time)->format('H:i');

        [$start, $end] = $this->hoursCalculator->parseWindow($date, $startTime, $endTime);
        $hours = $this->hoursCalculator->compute($date, $startTime, $endTime);

        $payload = [
            'start_time' => $start->format('H:i:s'),
            'end_time' => $end->format('H:i:s'),
            'duration_hours' => $hours['durationHours'],
            'weighted_hours' => $hours['weightedHours'],
            'rate_multiplier' => $hours['rateMultiplier'],
        ];

        if (in_array($request->status, ['approved', 'completed'], true)) {
            $payload['approved_hours'] = $hours['weightedHours'];
        }

        if (array_key_exists('assignmentReason', $data)) {
            $payload['assignment_reason'] = $data['assignmentReason'];
        }

        $fromStatus = $request->status;
        $changes = [
            'durationHours' => ['from' => (float) $request->duration_hours, 'to' => $hours['durationHours']],
            'weightedHours' => ['from' => (float) $request->weighted_hours, 'to' => $hours['weightedHours']],
            'startTime' => ['from' => Carbon::parse($request->start_time)->format('H:i'), 'to' => $start->format('H:i')],
            'endTime' => ['from' => Carbon::parse($request->end_time)->format('H:i'), 'to' => $end->format('H:i')],
        ];

        $request->update($payload);

        $this->logStatus(
            $request,
            action: 'recalculated',
            fromStatus: $fromStatus,
            toStatus: $fromStatus,
            assignmentReason: $data['assignmentReason'] ?? $request->assignment_reason,
            note: 'إعادة حساب ساعات الإضافي',
            changes: $changes,
        );

        return $request->fresh(['employee', 'statusLogs.actor', 'updatedBy']);
    }

    public function approve(OvertimeRequest $request, User $supervisor, ?float $approvedHours = null): OvertimeRequest
    {
        return DB::transaction(function () use ($request, $supervisor, $approvedHours) {
            $from = $request->status;
            $hours = $approvedHours ?? (float) $request->approved_hours;
            if ($hours <= 0) {
                $hours = (float) $request->weighted_hours;
            }
            if ($hours <= 0) {
                $computed = $this->hoursCalculator->compute(
                    $request->overtime_date->format('Y-m-d'),
                    Carbon::parse($request->start_time)->format('H:i'),
                    Carbon::parse($request->end_time)->format('H:i'),
                );
                $hours = $computed['weightedHours'];
            }

            $request->update([
                'status' => 'approved',
                'supervisor_id' => $supervisor->id,
                'approved_hours' => $hours,
                'approved_at' => now(),
                'rejected_at' => null,
                'rejection_reason' => null,
            ]);

            $this->logStatus(
                $request,
                action: 'approved',
                fromStatus: $from,
                toStatus: 'approved',
                assignmentReason: $request->assignment_reason,
                note: 'اعتماد الطلب',
                changes: ['approvedHours' => $hours],
            );

            return $request->fresh(['employee', 'statusLogs.actor', 'updatedBy']);
        });
    }

    public function reject(OvertimeRequest $request, User $supervisor, string $reason): OvertimeRequest
    {
        $from = $request->status;

        $request->update([
            'status' => 'rejected',
            'supervisor_id' => $supervisor->id,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);

        $this->logStatus(
            $request,
            action: 'rejected',
            fromStatus: $from,
            toStatus: 'rejected',
            rejectionReason: $reason,
            assignmentReason: $request->assignment_reason,
            note: 'رفض الطلب',
        );

        return $request->fresh(['employee', 'statusLogs.actor', 'updatedBy']);
    }

    public function complete(OvertimeRequest $request): OvertimeRequest
    {
        return DB::transaction(function () use ($request) {
            $from = $request->status;

            $request->update(['status' => 'completed']);

            $employee = Employee::query()->findOrFail($request->employee_id);
            $date = $request->overtime_date->format('Y-m-d');
            $record = AttendanceRecord::query()
                ->where('employee_id', $employee->id)
                ->whereDate('attendance_date', $date)
                ->first();

            $clockHours = (float) $request->duration_hours;
            if ($clockHours <= 0) {
                $computed = $this->hoursCalculator->compute(
                    $request->overtime_date->format('Y-m-d'),
                    Carbon::parse($request->start_time)->format('H:i'),
                    Carbon::parse($request->end_time)->format('H:i'),
                );
                $clockHours = $computed['durationHours'];
            }
            $extraMinutes = (int) round($clockHours * 60);
            if ($record && $extraMinutes > 0) {
                if ($request->overtime_date->isFriday()) {
                    $record->friday_overtime_minutes += $extraMinutes;
                    $record->friday_overtime_pay = round(
                        ($record->friday_overtime_minutes / 60) * (float) $record->friday_hourly_rate,
                        2
                    );
                } else {
                    $record->overtime_minutes += $extraMinutes;
                    $record->overtime_pay = round(
                        ($record->overtime_minutes / 60) * (float) $record->overtime_hourly_rate,
                        2
                    );
                }
                $record->total_pay = round(
                    (float) $record->regular_pay + (float) $record->overtime_pay + (float) $record->friday_overtime_pay,
                    2
                );
                $record->save();
            } elseif ($extraMinutes > 0) {
                $this->manualAttendance->applyOvertimeOnly(
                    $employee,
                    $date,
                    $extraMinutes,
                    $request->overtime_date->isFriday(),
                    'من طلب إضافي #'.$request->id,
                );
            }

            $this->logStatus(
                $request,
                action: 'completed',
                fromStatus: $from,
                toStatus: 'completed',
                assignmentReason: $request->assignment_reason,
                note: 'إغلاق الطلب ودمج ساعات الإضافي في الحضور (بدون دوام أساسي إن لم يكن مسجّلاً)',
            );

            return $request->fresh(['employee', 'statusLogs.actor', 'updatedBy']);
        });
    }

    public function softDelete(OvertimeRequest $request): void
    {
        DB::transaction(function () use ($request): void {
            $from = $request->status;

            $this->logStatus(
                $request,
                action: 'deleted',
                fromStatus: $from,
                toStatus: $from,
                assignmentReason: $request->assignment_reason,
                note: 'حذف الطلب (إلغاء تنشيط — soft delete)',
            );

            $request->delete();
        });
    }

    /**
     * @param  array<string, mixed>|null  $changes
     */
    private function logStatus(
        OvertimeRequest $request,
        string $action,
        ?string $fromStatus,
        string $toStatus,
        ?string $assignmentReason = null,
        ?string $rejectionReason = null,
        ?string $note = null,
        ?array $changes = null,
    ): void {
        OvertimeRequestStatusLog::query()->create([
            'overtime_request_id' => $request->id,
            'action' => $action,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'actor_id' => auth()->id(),
            'assignment_reason' => $assignmentReason,
            'rejection_reason' => $rejectionReason,
            'note' => $note,
            'changes' => $changes,
            'created_at' => now(),
        ]);
    }
}
