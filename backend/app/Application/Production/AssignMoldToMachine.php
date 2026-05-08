<?php

namespace App\Application\Production;

use App\Domain\Factory\Models\MachineAssignment;
use Illuminate\Support\Facades\DB;

class AssignMoldToMachine
{
    public function handle(array $data): MachineAssignment
    {
        return DB::transaction(function () use ($data): MachineAssignment {
            MachineAssignment::query()
                ->where('machine_id', $data['machine_id'])
                ->whereNull('ended_at')
                ->update(['ended_at' => now()]);

            return MachineAssignment::create([
                ...$data,
                'started_at' => $data['started_at'] ?? now(),
            ]);
        });
    }
}
