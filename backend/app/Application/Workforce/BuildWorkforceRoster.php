<?php

namespace App\Application\Workforce;

use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\EmploymentStatus;
use App\Domain\Factory\Models\MachineAssignment;

/**
 * Operational roster enriched for dashboards (PROJECT_ARCHITECTURE.md Phase 1).
 */
class BuildWorkforceRoster
{
    /**
     * @return list<array<string, mixed>>
     */
    public function handle(): array
    {
        $machineByEmp = [];

        MachineAssignment::query()
            ->whereNull('ended_at')
            ->with(['machine:id,code'])
            ->get()
            ->each(function (MachineAssignment $assignment) use (&$machineByEmp): void {
                if ($assignment->machine === null) {
                    return;
                }
                $code = (string) $assignment->machine->code;
                if ($assignment->operator_id !== null) {
                    $machineByEmp[(int) $assignment->operator_id] = $code;
                }
                if ($assignment->technician_id !== null) {
                    $oid = (int) $assignment->technician_id;
                    $machineByEmp[$oid] ??= $code;
                }
            });

        return Employee::query()
            ->where('is_active', '=', true)
            ->with([
                'hall:id,name,code,hall_type',
                'organizationalDepartment:id,name,code',
                'jobRole:id,name,code,role_level',
                'shift:id,name,code',
                'employmentStatus:id,name,code',
            ])
            ->orderBy('employee_number')
            ->get()
            ->map(fn (Employee $employee): array => $this->toRow($employee, $machineByEmp[(int) $employee->id] ?? null))
            ->values()
            ->all();
    }

    private function toRow(Employee $employee, ?string $machineCode): array
    {
        $performance = round((float) $employee->performance_score, 1);
        $reliability = round((float) $employee->reliability_score, 1);
        $safety = round((float) $employee->safety_score, 1);
        $avg = round(($performance + $reliability + max($safety, $performance * 0.8)) / 3, 1);

        return [
            'id' => $employee->id,
            'employeeNumber' => $employee->employee_number ?? $employee->code,
            'fullName' => $employee->full_name,
            'initials' => $this->initialsFor($employee->full_name),
            'role' => $employee->jobRole?->name ?? ($employee->job_title ?? ''),
            'department' => $employee->organizationalDepartment?->name ?? ($employee->department ?? ''),
            'hall' => $employee->hall?->name ?? '',
            'shift' => $employee->shift?->name ?? '',
            'shiftCode' => $employee->shift?->code,
            'attendance' => $this->deriveAttendance($employee->employmentStatus),
            'employmentStatusCode' => $employee->employmentStatus?->code,
            'employmentStatusLabel' => $employee->employmentStatus?->name,
            'performance' => $performance,
            'reliability' => $reliability,
            'productionEff' => max(52, min(99, $avg)),
            'safetyScore' => $safety,
            'bonusPoints' => max(120, min(960, (int) round(($performance + $reliability) * 4.8))),
            'violations' => 0,
            'machineCode' => $machineCode,
            'avatarHue' => $this->hueFromSeed($employee->full_name.(string) $employee->id),
            'basicSalary' => round((float) $employee->basic_salary, 2),
            'overtimeHourRate' => round((float) $employee->overtime_hour_rate, 2),
            'annualLeaveBalance' => (int) $employee->annual_leave_balance,
            'employeeCode' => $employee->code,
        ];
    }

    /**
     * Attendance payloads are synthesized from employment lifecycle until clocks exist.
     */
    private function deriveAttendance(?EmploymentStatus $status): string
    {
        return match ($status?->code) {
            'ON_LEAVE' => 'leave',
            'SUSPENDED' => 'absent',
            'TERMINATED' => 'absent',
            default => 'present',
        };
    }

    private function initialsFor(string $name): string
    {
        $parts = preg_split('/\s+/u', trim($name), -1, PREG_SPLIT_NO_EMPTY);
        if ($parts === []) {
            return '__';
        }
        $first = $parts[0];
        $last = $parts[array_key_last($parts)] ?? $first;
        $fi = preg_match('/^\X/u', $first, $m) ? mb_substr($m[0] ?? '', 0, 1, 'UTF-8') : mb_substr((string) $first, 0, 1);
        $li = preg_match('/^\X/u', $last, $m2) ? mb_substr($m2[0] ?? '', 0, 1, 'UTF-8') : mb_substr((string) $last, 0, 1);
        $out = mb_strtoupper($fi.$li, 'UTF-8');

        return $out !== '' ? $out : mb_strtoupper(mb_substr($name, 0, 2, 'UTF-8'), 'UTF-8');
    }

    private function hueFromSeed(string $seed): int
    {
        $crc = crc32(bin2hex($seed));

        return (int) (abs($crc) % 360);
    }
}
