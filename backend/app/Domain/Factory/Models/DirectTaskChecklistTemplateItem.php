<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\DirectTaskChecklistItemType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DirectTaskChecklistTemplateItem extends Model
{
    protected $fillable = [
        'template_id',
        'label',
        'item_type',
        'is_required',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'item_type' => DirectTaskChecklistItemType::class,
            'is_required' => 'boolean',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(DirectTaskChecklistTemplate::class, 'template_id');
    }
}
