<?php

namespace App\Application\Assembly;

use App\Application\Products\ProductBomService;
use App\Domain\Factory\Enums\AssemblyWorkOrderStatus;
use App\Domain\Factory\Models\AssemblyWorkOrder;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\StockLevel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AssemblyWorkOrderService
{
    public function __construct(
        private readonly ProductBomService $bom,
        private readonly AssemblyInventoryService $inventory,
    ) {}

    public function paginate(int $page, int $pageSize, ?string $status = null): LengthAwarePaginator
    {
        $q = AssemblyWorkOrder::query()->with('finalProduct')->orderByDesc('created_at');
        if ($status) {
            $q->where('status', $status);
        }

        return $q->paginate(perPage: $pageSize, page: $page);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): AssemblyWorkOrder
    {
        return DB::transaction(function () use ($data): AssemblyWorkOrder {
            $productId = (int) $data['finalProductId'];
            $product = Product::query()->findOrFail($productId);

            if (! $this->bom->flatLines($productId)->count()) {
                throw new InvalidArgumentException('المنتج لا يملك BOM — أضف المكوّنات أولاً.');
            }

            $code = (string) ($data['workOrderCode'] ?? $this->nextCode());

            return AssemblyWorkOrder::query()->create([
                'work_order_code' => $code,
                'final_product_id' => $productId,
                'planned_quantity' => (int) $data['plannedQuantity'],
                'completed_quantity' => 0,
                'status' => $data['status'] ?? AssemblyWorkOrderStatus::Planned->value,
                'planned_start_date' => $data['plannedStartDate'] ?? null,
                'planned_end_date' => $data['plannedEndDate'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);
        });
    }

    public function findDetail(int $id): AssemblyWorkOrder
    {
        return AssemblyWorkOrder::query()
            ->with(['finalProduct', 'operations.consumptions.componentProduct', 'operations.operator'])
            ->findOrFail($id);
    }

    /**
     * @return array{available: bool, shortages: list<array<string, mixed>>}
     */
    public function materialAvailability(int $workOrderId): array
    {
        $wo = AssemblyWorkOrder::query()->with('finalProduct')->findOrFail($workOrderId);
        $needed = $this->bom->explode((int) $wo->final_product_id, (float) $wo->planned_quantity);
        $shortages = [];

        foreach ($needed as $row) {
            $stock = $this->stockForProduct((int) $row['productId']);
            if ($stock < $row['quantity']) {
                $shortages[] = [
                    'productId' => $row['productId'],
                    'productCode' => $row['productCode'],
                    'productName' => $row['productName'],
                    'required' => $row['quantity'],
                    'available' => $stock,
                    'shortage' => round($row['quantity'] - $stock, 4),
                ];
            }
        }

        return ['available' => $shortages === [], 'shortages' => $shortages];
    }

    /**
     * @return array<string, mixed>
     */
    public function dashboardStats(): array
    {
        $active = AssemblyWorkOrder::query()->whereIn('status', ['planned', 'in_progress'])->count();
        $completed = AssemblyWorkOrder::query()->where('status', 'completed')->whereDate('updated_at', today())->count();
        $inProgress = AssemblyWorkOrder::query()->where('status', 'in_progress')->get();

        $totalPlanned = (int) $inProgress->sum('planned_quantity');
        $totalDone = (int) $inProgress->sum('completed_quantity');
        $progress = $totalPlanned > 0 ? round(($totalDone / $totalPlanned) * 100, 1) : 0;

        $shortageCount = 0;
        foreach (AssemblyWorkOrder::query()->whereIn('status', ['planned', 'in_progress'])->pluck('id') as $id) {
            $check = $this->materialAvailability((int) $id);
            if (! $check['available']) {
                $shortageCount++;
            }
        }

        return [
            'activeOrders' => $active,
            'completedToday' => $completed,
            'progressPercent' => $progress,
            'ordersWithShortages' => $shortageCount,
            'throughputUnits' => $totalDone,
        ];
    }

    private function stockForProduct(int $productId): float
    {
        return (float) StockLevel::query()
            ->where('item_type', Product::class)
            ->where('item_id', $productId)
            ->sum('quantity');
    }

    private function nextCode(): string
    {
        $n = AssemblyWorkOrder::query()->count() + 1;

        return 'AWO-'.str_pad((string) $n, 5, '0', STR_PAD_LEFT);
    }
}
