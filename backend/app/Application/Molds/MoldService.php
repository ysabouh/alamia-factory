<?php

namespace App\Application\Molds;

use App\Domain\Factory\Enums\MoldType;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\MoldInstallation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MoldService
{
    public function __construct(
        private readonly MoldSpecRegistry $specRegistry,
        private readonly MoldMachineCompatibility $compatibility,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginate(array $filters, int $page, int $pageSize): LengthAwarePaginator
    {
        $q = $this->filterQuery($filters)
            ->with(['machine.type', 'product', 'images' => fn ($i) => $i->where('is_primary', true)->limit(1)]);

        $sort = (string) ($filters['sort'] ?? 'code');
        $dir = strtolower((string) ($filters['sortDir'] ?? 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowed = ['code', 'name', 'status', 'mold_type', 'created_at'];
        if (! in_array($sort, $allowed, true)) {
            $sort = 'code';
        }

        return $q->orderBy($sort, $dir)->paginate(perPage: $pageSize, page: $page);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listByType(string $type, array $filters, int $page, int $pageSize): LengthAwarePaginator
    {
        $filters['mold_type'] = $type;

        return $this->paginate($filters, $page, $pageSize);
    }

    public function findDetail(int $id): Mold
    {
        return Mold::query()
            ->with([
                'machine.type',
                'product',
                'injectionSpec',
                'petBlowSpec',
                'compressionSpec',
                'polyethyleneSpec',
                'images',
                'maintenanceLogs' => fn ($q) => $q->limit(20),
                'installations.machine.type',
                'installations.installer',
                'activeInstallation.machine.type',
            ])
            ->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Mold
    {
        return DB::transaction(function () use ($data): Mold {
            $machine = $this->resolveMachine($data['machine_id'] ?? null);
            $moldType = MoldType::from((string) $data['mold_type']);
            $this->compatibility->assertCompatible($moldType->value, $machine);

            $mold = Mold::query()->create($this->moldAttributes($data));
            $this->specRegistry->upsert($mold, $moldType, $data['spec'] ?? null);
            $this->syncInstallation($mold, $machine);

            return $this->findDetail($mold->id);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Mold $mold, array $data): Mold
    {
        return DB::transaction(function () use ($mold, $data): Mold {
            $machine = array_key_exists('machine_id', $data)
                ? $this->resolveMachine($data['machine_id'])
                : $mold->machine;

            $moldType = isset($data['mold_type'])
                ? MoldType::from((string) $data['mold_type'])
                : $mold->mold_type;

            $this->compatibility->assertCompatible($moldType->value, $machine);

            $previousMachineId = $mold->machine_id;
            $mold->fill($this->moldAttributes($data, false));
            $mold->save();

            if (array_key_exists('spec', $data)) {
                $this->specRegistry->upsert($mold, $moldType, $data['spec']);
            }

            if (array_key_exists('machine_id', $data) && (int) $data['machine_id'] !== (int) $previousMachineId) {
                $this->syncInstallation($mold->fresh(), $machine);
            }

            return $this->findDetail($mold->id);
        });
    }

    public function delete(Mold $mold): void
    {
        $mold->delete();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function filterQuery(array $filters): Builder
    {
        $q = Mold::query();

        if (! empty($filters['mold_type'])) {
            $q->where('mold_type', (string) $filters['mold_type']);
        }
        if (! empty($filters['status'])) {
            $q->where('status', (string) $filters['status']);
        }
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $q->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }
        if (! empty($filters['machine_id'])) {
            $q->where('machine_id', (int) $filters['machine_id']);
        }
        if (! empty($filters['search'])) {
            $s = '%'.$filters['search'].'%';
            $q->where(function (Builder $w) use ($s): void {
                $w->where('code', 'like', $s)
                    ->orWhere('name', 'like', $s)
                    ->orWhere('product_name', 'like', $s)
                    ->orWhere('manufacturer', 'like', $s);
            });
        }

        return $q;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function moldAttributes(array $data, bool $forCreate = true): array
    {
        $attrs = [
            'product_id' => $data['product_id'] ?? null,
            'code' => $data['code'] ?? null,
            'name' => $data['name'] ?? null,
            'mold_type' => $data['mold_type'] ?? null,
            'status' => $data['status'] ?? null,
            'cavity_count' => $data['cavity_count'] ?? null,
            'product_name' => $data['product_name'] ?? null,
            'material_type' => $data['material_type'] ?? null,
            'machine_id' => $data['machine_id'] ?? null,
            'manufacturer' => $data['manufacturer'] ?? null,
            'manufacturing_country' => $data['manufacturing_country'] ?? null,
            'manufacturing_date' => $data['manufacturing_date'] ?? null,
            'purchase_date' => $data['purchase_date'] ?? null,
            'purchase_cost' => $data['purchase_cost'] ?? null,
            'mold_weight' => $data['mold_weight'] ?? null,
            'mold_dimensions' => $data['mold_dimensions'] ?? null,
            'expected_life_cycles' => $data['expected_life_cycles'] ?? null,
            'total_cycles' => $data['total_cycles'] ?? null,
            'current_location' => $data['current_location'] ?? null,
            'maintenance_cycle' => $data['maintenance_cycle'] ?? null,
            'last_maintenance_date' => $data['last_maintenance_date'] ?? null,
            'next_maintenance_date' => $data['next_maintenance_date'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'notes' => $data['notes'] ?? null,
            'default_cycle_seconds' => $data['default_cycle_seconds'] ?? null,
            'expected_piece_weight_grams' => $data['expected_piece_weight_grams'] ?? null,
            'is_active' => $data['is_active'] ?? null,
        ];

        if ($forCreate) {
            return array_filter($attrs, fn ($v) => $v !== null);
        }

        return array_filter($attrs, fn ($v, $k) => array_key_exists($k, $data), ARRAY_FILTER_USE_BOTH);
    }

    private function resolveMachine(mixed $machineId): ?Machine
    {
        if ($machineId === null || $machineId === '') {
            return null;
        }

        return Machine::query()->with('type')->findOrFail((int) $machineId);
    }

    private function syncInstallation(Mold $mold, ?Machine $machine): void
    {
        if ($machine === null) {
            MoldInstallation::query()
                ->where('mold_id', $mold->id)
                ->whereNull('removed_at')
                ->update(['removed_at' => now()]);

            return;
        }

        $active = MoldInstallation::query()
            ->where('mold_id', $mold->id)
            ->whereNull('removed_at')
            ->first();

        if ($active && (int) $active->machine_id === (int) $machine->id) {
            return;
        }

        if ($active) {
            $active->update(['removed_at' => now()]);
        }

        MoldInstallation::query()->create([
            'mold_id' => $mold->id,
            'machine_id' => $machine->id,
            'installed_at' => now(),
            'installed_by' => Auth::id(),
        ]);
    }
}
