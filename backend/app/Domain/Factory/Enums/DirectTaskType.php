<?php

namespace App\Domain\Factory\Enums;

enum DirectTaskType: string
{
    case Direct = 'direct';
    case Immediate = 'immediate';
    case Emergency = 'emergency';
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Monthly = 'monthly';

    public function isRecurring(): bool
    {
        return in_array($this, [self::Daily, self::Weekly, self::Monthly], true);
    }
}
