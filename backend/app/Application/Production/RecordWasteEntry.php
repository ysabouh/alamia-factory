<?php

namespace App\Application\Production;

use App\Domain\Factory\Models\WasteEntry;
use App\Infrastructure\Broadcasting\WasteEntryCreated;
use Illuminate\Support\Facades\DB;

class RecordWasteEntry
{
    public function handle(array $data, ?int $userId): WasteEntry
    {
        return DB::transaction(function () use ($data, $userId): WasteEntry {
            $entry = WasteEntry::create([
                ...$data,
                'created_by' => $userId,
            ]);

            WasteEntryCreated::dispatch($entry);

            return $entry;
        });
    }
}
