<?php

namespace App\Application\Quality;

use App\Domain\Factory\Models\QualityChecklist;
use App\Domain\Factory\Models\QualityChecklistItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class QualityChecklistService
{
    /**
     * @return Collection<int, QualityChecklist>
     */
    public function listForProduct(int $productId): Collection
    {
        return QualityChecklist::query()
            ->where('product_id', $productId)
            ->with('items')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get();
    }

    public function find(int $id): QualityChecklist
    {
        return QualityChecklist::query()->with('items')->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(int $productId, array $data): QualityChecklist
    {
        return DB::transaction(function () use ($productId, $data): QualityChecklist {
            $checklist = QualityChecklist::query()->create([
                'product_id' => $productId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'is_active' => (bool) ($data['isActive'] ?? true),
            ]);

            if (! empty($data['items']) && is_array($data['items'])) {
                $this->syncItems($checklist, $data['items']);
            }

            return $this->find($checklist->id);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(QualityChecklist $checklist, array $data): QualityChecklist
    {
        return DB::transaction(function () use ($checklist, $data): QualityChecklist {
            if (array_key_exists('name', $data)) {
                $checklist->name = $data['name'];
            }
            if (array_key_exists('description', $data)) {
                $checklist->description = $data['description'];
            }
            if (array_key_exists('isActive', $data)) {
                $checklist->is_active = (bool) $data['isActive'];
            }
            $checklist->save();

            if (array_key_exists('items', $data)) {
                $this->syncItems($checklist, $data['items'] ?? []);
            }

            return $this->find($checklist->id);
        });
    }

    public function delete(QualityChecklist $checklist): void
    {
        $checklist->delete();
    }

    public function activeForProduct(int $productId): ?QualityChecklist
    {
        return QualityChecklist::query()
            ->where('product_id', $productId)
            ->where('is_active', true)
            ->with('items')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function syncItems(QualityChecklist $checklist, array $items): void
    {
        QualityChecklistItem::query()->where('checklist_id', $checklist->id)->delete();

        $order = 10;
        foreach ($items as $item) {
            if (empty($item['itemName'])) {
                continue;
            }

            QualityChecklistItem::query()->create([
                'checklist_id' => $checklist->id,
                'item_name' => $item['itemName'],
                'item_type' => $item['itemType'] ?? 'numeric',
                'min_value' => $item['minValue'] ?? null,
                'max_value' => $item['maxValue'] ?? null,
                'unit' => $item['unit'] ?? null,
                'selection_options' => $item['selectionOptions'] ?? null,
                'sort_order' => (int) ($item['sortOrder'] ?? $order),
                'is_required' => (bool) ($item['isRequired'] ?? true),
                'is_critical' => (bool) ($item['isCritical'] ?? false),
            ]);
            $order += 10;
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function addItem(QualityChecklist $checklist, array $data): QualityChecklistItem
    {
        if (empty($data['itemName'])) {
            throw new InvalidArgumentException('Item name is required.');
        }

        $max = QualityChecklistItem::query()->where('checklist_id', $checklist->id)->max('sort_order');

        return QualityChecklistItem::query()->create([
            'checklist_id' => $checklist->id,
            'item_name' => $data['itemName'],
            'item_type' => $data['itemType'] ?? 'numeric',
            'min_value' => $data['minValue'] ?? null,
            'max_value' => $data['maxValue'] ?? null,
            'unit' => $data['unit'] ?? null,
            'selection_options' => $data['selectionOptions'] ?? null,
            'sort_order' => (int) ($data['sortOrder'] ?? ((int) $max) + 10),
            'is_required' => (bool) ($data['isRequired'] ?? true),
            'is_critical' => (bool) ($data['isCritical'] ?? false),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function updateItem(QualityChecklistItem $item, array $data): QualityChecklistItem
    {
        if (array_key_exists('itemName', $data)) {
            if (empty($data['itemName'])) {
                throw new InvalidArgumentException('Item name is required.');
            }
            $item->item_name = $data['itemName'];
        }
        if (array_key_exists('itemType', $data)) {
            $item->item_type = $data['itemType'];
        }
        if (array_key_exists('minValue', $data)) {
            $item->min_value = $data['minValue'];
        }
        if (array_key_exists('maxValue', $data)) {
            $item->max_value = $data['maxValue'];
        }
        if (array_key_exists('unit', $data)) {
            $item->unit = $data['unit'] === '' ? null : $data['unit'];
        }
        if (array_key_exists('selectionOptions', $data)) {
            $item->selection_options = $data['selectionOptions'];
        }
        if (array_key_exists('sortOrder', $data)) {
            $item->sort_order = (int) $data['sortOrder'];
        }
        if (array_key_exists('isRequired', $data)) {
            $item->is_required = (bool) $data['isRequired'];
        }
        if (array_key_exists('isCritical', $data)) {
            $item->is_critical = (bool) $data['isCritical'];
        }

        $item->save();

        return $item->fresh();
    }
}
