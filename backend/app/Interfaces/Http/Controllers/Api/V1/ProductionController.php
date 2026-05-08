<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Production\AssignMoldToMachine;
use App\Application\Production\RecordProductionEntry;
use App\Application\Production\RecordWasteEntry;
use App\Domain\Factory\Models\ProductionEntry;
use App\Interfaces\Http\Requests\AssignMoldRequest;
use App\Interfaces\Http\Requests\RecordProductionEntryRequest;
use App\Interfaces\Http\Requests\RecordWasteEntryRequest;
use App\Interfaces\Http\Resources\ProductionEntryResource;
use App\Interfaces\Http\Resources\WasteEntryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductionController
{
    public function assign(AssignMoldRequest $request, AssignMoldToMachine $assign): JsonResponse
    {
        $assignment = $assign->handle($request->validated());

        return response()->json(['data' => $assignment], 201);
    }

    public function storeEntry(
        RecordProductionEntryRequest $request,
        RecordProductionEntry $recordProduction
    ): ProductionEntryResource {
        return ProductionEntryResource::make(
            $recordProduction->handle($request->validated(), $request->user()?->id)
        );
    }

    public function storeWaste(
        RecordWasteEntryRequest $request,
        RecordWasteEntry $recordWaste
    ): WasteEntryResource {
        return WasteEntryResource::make(
            $recordWaste->handle($request->validated(), $request->user()?->id)
        );
    }

    public function dailyReport(Request $request): JsonResponse
    {
        $date = $request->query('date', now()->toDateString());

        $rows = ProductionEntry::query()
            ->with(['machine', 'mold', 'shift'])
            ->whereDate('entry_date', $date)
            ->get()
            ->groupBy(fn (ProductionEntry $entry): string => $entry->machine->code.'|'.$entry->mold->code)
            ->map(fn ($entries, string $key): array => [
                'key' => $key,
                'machine' => $entries->first()->machine->name,
                'mold' => $entries->first()->mold->name,
                'producedPieces' => (int) $entries->sum('produced_pieces'),
                'producedWeightKg' => (float) $entries->sum('produced_weight_kg'),
            ])
            ->values();

        return response()->json(['date' => $date, 'data' => $rows]);
    }
}
