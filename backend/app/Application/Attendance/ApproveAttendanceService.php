<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\AttendanceActivityLog;
use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\User;

class ApproveAttendanceService
{
    public function handle(AttendanceRecord $record, User $supervisor): AttendanceRecord
    {
        $record->approved_by_supervisor_id = $supervisor->id;
        $record->approved_at = now();
        $record->save();

        AttendanceActivityLog::log(AttendanceRecord::class, (int) $record->id, 'approved', [
            'supervisorId' => $supervisor->id,
        ]);

        return $record->fresh(['employee']);
    }
}
