<?php

namespace Tests\Unit;

use App\Application\Attendance\OvertimeHoursCalculator;
use Tests\TestCase;

class OvertimeHoursCalculatorTest extends TestCase
{
    public function test_weekday_weighted_hours_use_one_and_half_multiplier(): void
    {
        $calc = new OvertimeHoursCalculator;
        $result = $calc->compute('2026-05-19', '16:00', '18:00');

        $this->assertSame(2.0, $result['durationHours']);
        $this->assertSame(3.0, $result['weightedHours']);
        $this->assertSame(1.5, $result['rateMultiplier']);
        $this->assertFalse($result['isFriday']);
    }

    public function test_friday_weighted_hours_use_double_multiplier(): void
    {
        $calc = new OvertimeHoursCalculator;
        $result = $calc->compute('2026-05-22', '16:00', '18:00');

        $this->assertSame(2.0, $result['durationHours']);
        $this->assertSame(4.0, $result['weightedHours']);
        $this->assertSame(2.0, $result['rateMultiplier']);
        $this->assertTrue($result['isFriday']);
    }
}
