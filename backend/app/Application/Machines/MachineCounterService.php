<?php

namespace App\Application\Machines;

use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineCounter;
use Illuminate\Support\Collection;

class MachineCounterService
{
    /**
     * @return Collection<int, MachineCounter>
     */
    public function list(Machine $machine, ?string $from = null, ?string $to = null): Collection
    {
        $q = MachineCounter::query()
            ->where('machine_id', $machine->id)
            ->orderByDesc('counter_date');

        if ($from) {
            $q->whereDate('counter_date', '>=', $from);
        }
        if ($to) {
            $q->whereDate('counter_date', '<=', $to);
        }

        return $q->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function upsert(Machine $machine, array $data): MachineCounter
    {
        return MachineCounter::query()->updateOrCreate(
            [
                'machine_id' => $machine->id,
                'counter_date' => $data['counter_date'],
            ],
            [
                'produced_units' => (int) ($data['produced_units'] ?? 0),
                'rejected_units' => (int) ($data['rejected_units'] ?? 0),
                'running_hours' => (float) ($data['running_hours'] ?? 0),
            ]
        );
    }
}
