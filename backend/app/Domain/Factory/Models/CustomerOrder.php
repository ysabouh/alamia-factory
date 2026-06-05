<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerOrder extends Model
{
    use TracksAuditorColumns;

    protected $fillable = [
        'customer_id',
        'code',
        'status',
        'ordered_at',
        'due_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'ordered_at' => 'date',
            'due_date' => 'date',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CustomerOrderItem::class);
    }
}
