<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Quality;

use App\Application\Quality\QualityInspectionPhotoService;
use App\Application\Quality\QualityInspectionService;
use App\Domain\Factory\Enums\InspectionResultStatus;
use App\Domain\Factory\Models\QualityDefect;
use App\Domain\Factory\Models\QualityInspection;
use App\Domain\Factory\Models\QualityInspectionPhoto;
use App\Domain\Factory\Models\WorkOrder;
use App\Interfaces\Http\Support\SerializesQuality;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class QualityInspectionController
{
    use SerializesQuality;

    public function __construct(
        private readonly QualityInspectionService $inspections,
        private readonly QualityInspectionPhotoService $photos,
    ) {}

    public function index(WorkOrder $workOrder): JsonResponse
    {
        $items = $this->inspections->listForOrder($workOrder->id);

        return response()->json([
            'data' => $items->map(fn (QualityInspection $i) => $this->serializeInspection($i))->values(),
        ]);
    }

    public function store(Request $request, WorkOrder $workOrder): JsonResponse
    {
        try {
            $inspection = $this->inspections->create(
                $workOrder->id,
                $this->validatedInspection($request),
                Auth::id()
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeInspection($inspection)], 201);
    }

    public function show(QualityInspection $qualityInspection): JsonResponse
    {
        return response()->json([
            'data' => $this->serializeInspection($this->inspections->find($qualityInspection->id)),
        ]);
    }

    public function update(Request $request, QualityInspection $qualityInspection): JsonResponse
    {
        try {
            $inspection = $this->inspections->update($qualityInspection, $this->validatedInspection($request, false));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeInspection($inspection)]);
    }

    public function storePhoto(Request $request, QualityInspection $qualityInspection): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'image', 'max:10240'],
        ]);

        $photo = $this->photos->upload($qualityInspection, $request->file('photo'));

        return response()->json(['data' => $this->serializeInspectionPhoto($photo)], 201);
    }

    public function updatePhoto(Request $request, QualityInspectionPhoto $qualityInspectionPhoto): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'image', 'max:10240'],
        ]);

        $photo = $this->photos->replace($qualityInspectionPhoto, $request->file('photo'));

        return response()->json(['data' => $this->serializeInspectionPhoto($photo)]);
    }

    public function destroyPhoto(QualityInspectionPhoto $qualityInspectionPhoto): JsonResponse
    {
        $this->photos->delete($qualityInspectionPhoto);

        return response()->json(['deleted' => true]);
    }

    public function defectsCatalog(): JsonResponse
    {
        $items = QualityDefect::query()->where('is_active', true)->orderBy('name')->get();

        return response()->json([
            'data' => $items->map(fn (QualityDefect $d) => $this->serializeDefectCatalog($d))->values(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedInspection(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'qualityEmployeeId' => ['nullable', 'integer', 'exists:employees,id'],
            'inspectionTime' => ['nullable', 'date'],
            'sampleSize' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
            'correctiveAction' => ['nullable', 'string'],
            'isFinal' => ['nullable', 'boolean'],
            'results' => ['nullable', 'array'],
            'results.*.checklistItemId' => ['required_with:results', 'integer', 'exists:quality_checklist_items,id'],
            'results.*.measuredValue' => ['nullable'],
            'results.*.resultStatus' => ['nullable', Rule::enum(InspectionResultStatus::class)],
            'results.*.notes' => ['nullable', 'string'],
            'defects' => ['nullable', 'array'],
            'defects.*.defectId' => ['required_with:defects', 'integer', 'exists:quality_defects,id'],
            'defects.*.quantity' => ['nullable', 'integer', 'min:1'],
            'defects.*.notes' => ['nullable', 'string'],
        ]);
    }
}
