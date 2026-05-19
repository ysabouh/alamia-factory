<?php

namespace Tests\Unit;

use App\Application\Attendance\AttendanceDefaults;
use PHPUnit\Framework\TestCase;

class AttendanceDefaultsTest extends TestCase
{
    public function test_minutes_between_default_shift_times(): void
    {
        $this->assertSame(480, AttendanceDefaults::minutesBetween('08:00', '16:00'));
    }

    public function test_minutes_spanning_past_midnight(): void
    {
        $this->assertSame(120, AttendanceDefaults::minutesBetween('22:00', '00:00'));
    }

    public function test_factory_default_window_eleven_hours(): void
    {
        $this->assertSame(660, AttendanceDefaults::minutesBetween('08:00', '19:00'));
    }
}
