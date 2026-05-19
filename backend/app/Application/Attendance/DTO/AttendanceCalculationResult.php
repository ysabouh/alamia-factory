<?php

namespace App\Application\Attendance\DTO;

readonly class AttendanceCalculationResult
{
    public function __construct(
        public int $workedMinutes,
        public int $overtimeMinutes,
        public int $fridayOvertimeMinutes,
        public int $lateMinutes,
        public int $earlyLeaveMinutes,
        public string $attendanceStatus,
        public float $hourlyRate,
        public float $overtimeHourlyRate,
        public float $fridayHourlyRate,
        public float $regularPay,
        public float $overtimePay,
        public float $fridayOvertimePay,
        public float $totalPay,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toRecordAttributes(): array
    {
        return [
            'worked_minutes' => $this->workedMinutes,
            'overtime_minutes' => $this->overtimeMinutes,
            'friday_overtime_minutes' => $this->fridayOvertimeMinutes,
            'late_minutes' => $this->lateMinutes,
            'early_leave_minutes' => $this->earlyLeaveMinutes,
            'attendance_status' => $this->attendanceStatus,
            'hourly_rate' => $this->hourlyRate,
            'overtime_hourly_rate' => $this->overtimeHourlyRate,
            'friday_hourly_rate' => $this->fridayHourlyRate,
            'regular_pay' => $this->regularPay,
            'overtime_pay' => $this->overtimePay,
            'friday_overtime_pay' => $this->fridayOvertimePay,
            'total_pay' => $this->totalPay,
        ];
    }
}
