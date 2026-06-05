<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Quality;

use App\Application\Quality\QualityChecklistService;
use App\Domain\Factory\Enums\ChecklistItemType;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\QualityChecklist;
use App\Domain\Factory\Models\QualityChecklistItem;
use App\Interfaces\Http\Support\SerializesQuality;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class QualityChecklistController
{
    use SerializesQuality;

    public function __construct(
        private readonly QualityChecklistService $checklists,
    ) {}

    public function index(Product $product): JsonResponse
    {
        $items = $this->checklists->listForProduct($product->id);

        return response()->json([
            'data' => $items->map(fn (QualityChecklist $c) => $this->serializeChecklist($c))->values(),
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $data = $this->validatedChecklist($request);
        $checklist = $this->checklists->create($product->id, $data);

        return response()->json(['data' => $this->serializeChecklist($checklist)], 201);
    }

    public function update(Request $request, QualityChecklist $qualityChecklist): JsonResponse
    {
        $checklist = $this->checklists->update($qualityChecklist, $this->validatedChecklist($request, false));

        return response()->json(['data' => $this->serializeChecklist($checklist)]);
    }

    public function destroy(QualityChecklist $qualityChecklist): JsonResponse
    {
        $this->checklists->delete($qualityChecklist);

        return response()->json(null, 204);
    }

    public function storeItem(Request $request, QualityChecklist $qualityChecklist): JsonResponse
    {
        try {
            $item = $this->checklists->addItem($qualityChecklist, $this->validatedItem($request));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeChecklistItem($item)], 201);
    }

    public function updateItem(Request $request, QualityChecklistItem $qualityChecklistItem): JsonResponse
    {
        try {
            $item = $this->checklists->updateItem($qualityChecklistItem, $this->validatedItem($request, false));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeChecklistItem($item)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedChecklist(Request $request, bool $requireName = true): array
    {
        return $request->validate([
            'name' => [$requireName ? 'required' : 'sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'isActive' => ['nullable', 'boolean'],
            'items' => ['nullable', 'array'],
            'items.*.itemName' => ['required_with:items', 'string', 'max:255'],
            'items.*.itemType' => ['nullable', Rule::enum(ChecklistItemType::class)],
            'items.*.minValue' => ['nullable', 'numeric'],
            'items.*.maxValue' => ['nullable', 'numeric'],
            'items.*.unit' => ['nullable', 'string', 'max:32'],
            'items.*.selectionOptions' => ['nullable', 'array'],
            'items.*.sortOrder' => ['nullable', 'integer', 'min:1'],
            'items.*.isRequired' => ['nullable', 'boolean'],
            'items.*.isCritical' => ['nullable', 'boolean'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedItem(Request $request, bool $requireName = true): array
    {
        return $request->validate([
            'itemName' => [$requireName ? 'required' : 'sometimes', 'string', 'max:255'],
            'itemType' => ['nullable', Rule::enum(ChecklistItemType::class)],
            'minValue' => ['nullable', 'numeric'],
            'maxValue' => ['nullable', 'numeric'],
            'unit' => ['nullable', 'string', 'max:32'],
            'selectionOptions' => ['nullable', 'array'],
            'sortOrder' => ['nullable', 'integer', 'min:1'],
            'isRequired' => ['nullable', 'boolean'],
            'isCritical' => ['nullable', 'boolean'],
        ]);
    }
}
