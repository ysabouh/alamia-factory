<?php

namespace App\Application\Production;

use App\Domain\Factory\Models\ProductionEntry;
use App\Infrastructure\Broadcasting\ProductionEntryCreated;
use Illuminate\Support\Facades\DB;

class RecordProductionEntry
{
    public function handle(array $data, ?int $userId): ProductionEntry
    {
        return DB::transaction(function () use ($data, $userId): ProductionEntry {
            $entry = ProductionEntry::create([
                ...$data,
                'created_by' => $userId,
            ]);

            ProductionEntryCreated::dispatch($entry);

            return $entry;
        });
    }
}
