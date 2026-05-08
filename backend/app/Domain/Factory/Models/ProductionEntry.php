<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\BelongsToFactoryUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionEntry extends Model
{
    use BelongsToFactoryUser;

    protected $fillable = [
        'machine_id',
        'mold_id',
        'work_order_id',
        'shift_id',
        'entry_date',
        'produced_pieces',
        'produced_weight_kg',
        'piece_weight_grams',
        'created_by_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date',
            'produced_weight_kg' => 'decimal:3',
            'piece_weight_grams' => 'decimal:3',
        ];
    }

    public function machine(): BelongsTo
    {
        return $this->belongsTo(Machine::class);
    }

    public function mold(): BelongsTo
    {
        return $this->belongsTo(Mold::class);
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
