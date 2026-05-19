<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Currency extends Model
{
    protected $fillable = [
        'code',
        'name',
        'symbol',
        'usd_exchange_rate',
        'is_base',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'usd_exchange_rate' => 'decimal:6',
            'is_base' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    /** تحويل مبلغ من هذه العملة إلى دولار */
    public function amountToUsd(float $amount): float
    {
        $rate = (float) $this->usd_exchange_rate;
        if ($rate <= 0) {
            return 0.0;
        }

        return round($amount / $rate, 4);
    }

    /** تحويل مبلغ من دولار إلى هذه العملة */
    public function amountFromUsd(float $usdAmount): float
    {
        return round($usdAmount * (float) $this->usd_exchange_rate, 4);
    }
}
