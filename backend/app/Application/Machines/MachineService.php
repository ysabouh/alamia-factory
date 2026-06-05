<?php

namespace App\Application\Machines;

use App\Domain\Factory\Enums\MachineStatus;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class MachineService
{
    public function __construct(
        private readonly MachineSpecRegistry $specRegistry,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters, int $page, int $pageSize): LengthAwarePaginator
    {
        $q = $this->filterQuery($filters)
            ->with(['type', 'injectionSpec', 'blowSpec'])
            ->withCount(['maintenanceTickets as open_breakdown_count' => function (Builder $t): void {
                $t->where('ticket_kind', 'breakdown')->whereIn('status', ['open', 'in_progress']);
            }])
            ->withSum(['counters as today_produced_sum' => function (Builder $c): void {
                $c->whereDate('counter_date', today());
            }], 'produced_units');

        $sort = (string) ($filters['sort'] ?? 'code');
        $dir = strtolower((string) ($filters['sortDir'] ?? 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowed = ['code', 'name', 'status', 'created_at'];
        if (! in_array($sort, $allowed, true)) {
            $sort = 'code';
        }

        return $q->orderBy($sort, $dir)->paginate(perPage: $pageSize, page: $page);
    }

    public function findDetail(int $id): Machine
    {
        return Machine::query()
            ->with([
                'type',
                'injectionSpec',
                'blowSpec',
                'activeAssignment.mold',
                'maintenanceTickets' => fn ($q) => $q->latest()->limit(5),
            ])
            ->withSum(['counters as today_produced_sum' => function (Builder $c): void {
                $c->whereDate('counter_date', today());
            }], 'produced_units')
            ->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Machine
    {
        return DB::transaction(function () use ($data): Machine {
            $type = MachineType::query()->findOrFail($data['machine_type_id']);
            $machine = Machine::query()->create($this->machineAttributes($data));
            $this->specRegistry->upsert($machine, $type, $data['spec'] ?? null);

            return $this->findDetail($machine->id);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Machine $machine, array $data): Machine
    {
        return DB::transaction(function () use ($machine, $data): Machine {
            $machine->fill($this->machineAttributes($data, false));
            $machine->save();

            if (isset($data['machine_type_id'])) {
                $type = MachineType::query()->findOrFail($data['machine_type_id']);
            } else {
                $type = $machine->type;
            }

            if (array_key_exists('spec', $data)) {
                $this->specRegistry->upsert($machine, $type, $data['spec']);
            }

            return $this->findDetail($machine->id);
        });
    }

    public function delete(Machine $machine): void
    {
        $machine->delete();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function filterQuery(array $filters): Builder
    {
        $q = Machine::query();

        if (! empty($filters['machine_type_id'])) {
            $q->where('machine_type_id', (int) $filters['machine_type_id']);
        }
        if (! empty($filters['type'])) {
            $q->ofTypeCode((string) $filters['type']);
        }
        if (! empty($filters['status'])) {
            $q->where('status', (string) $filters['status']);
        }
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $q->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }
        if (! empty($filters['search'])) {
            $s = '%'.$filters['search'].'%';
            $q->where(function (Builder $w) use ($s): void {
                $w->where('code', 'like', $s)
                    ->orWhere('name', 'like', $s)
                    ->orWhere('serial_number', 'like', $s)
                    ->orWhere('brand', 'like', $s);
            });
        }

        return $q;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function machineAttributes(array $data, bool $forCreate = true): array
    {
        $attrs = [
            'machine_type_id' => $data['machine_type_id'] ?? null,
            'code' => $data['code'] ?? null,
            'name' => $data['name'] ?? null,
            'brand' => $data['brand'] ?? null,
            'model' => $data['model'] ?? null,
            'serial_number' => $data['serial_number'] ?? null,
            'factory_section' => $data['factory_section'] ?? null,
            'production_line' => $data['production_line'] ?? null,
            'power_kw' => $data['power_kw'] ?? null,
            'hourly_energy_consumption' => $data['hourly_energy_consumption'] ?? null,
            'installation_date' => $data['installation_date'] ?? null,
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'status_note' => $data['status_note'] ?? null,
        ];

        if (isset($data['status'])) {
            $attrs['status'] = $data['status'];
        } elseif ($forCreate) {
            $attrs['status'] = MachineStatus::Stopped->value;
            $attrs['last_status_changed_at'] = now();
        }

        return array_filter($attrs, fn ($v) => $v !== null);
    }
}
