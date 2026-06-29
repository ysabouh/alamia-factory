<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Enums\MachineStatus;
use App\Domain\Factory\Enums\MaintenanceTicketKind;
use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Machine extends Model
{
    use SoftDeletes;
    use TracksAuditorColumns;

    protected $fillable = [
        'machine_type_id',
        'code',
        'name',
        'brand',
        'model',
        'serial_number',
        'factory_section',
        'production_line',
        'power_kw',
        'hourly_energy_consumption',
        'installation_date',
        'notes',
        'image_url',
        'is_active',
        'status',
        'status_note',
        'last_status_changed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => MachineStatus::class,
            'is_active' => 'boolean',
            'installation_date' => 'date',
            'power_kw' => 'decimal:2',
            'hourly_energy_consumption' => 'decimal:2',
            'last_status_changed_at' => 'datetime',
        ];
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(MachineType::class, 'machine_type_id');
    }

    public function injectionSpec(): HasOne
    {
        return $this->hasOne(InjectionMachineSpec::class);
    }

    public function blowSpec(): HasOne
    {
        return $this->hasOne(BlowMachineSpec::class);
    }

    public function counters(): HasMany
    {
        return $this->hasMany(MachineCounter::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(MachineImage::class);
    }

    public function activeAssignment(): HasOne
    {
        return $this->hasOne(MachineAssignment::class)->whereNull('ended_at')->latestOfMany();
    }

    public function productionEntries(): HasMany
    {
        return $this->hasMany(ProductionEntry::class);
    }

    public function maintenanceTickets(): HasMany
    {
        return $this->hasMany(MaintenanceTicket::class);
    }

    public function preventivePlans(): HasMany
    {
        return $this->hasMany(PreventiveMaintenancePlan::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOfTypeCode(Builder $query, string $code): Builder
    {
        return $query->whereHas('type', fn (Builder $t) => $t->where('code', $code));
    }

    public function scopeWithOpenBreakdown(Builder $query): Builder
    {
        return $query->whereHas('maintenanceTickets', function (Builder $t): void {
            $t->where('ticket_kind', MaintenanceTicketKind::Breakdown->value)
                ->whereIn('status', ['open', 'in_progress']);
        });
    }
}
