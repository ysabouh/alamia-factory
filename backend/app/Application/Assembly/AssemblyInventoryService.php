<?php

namespace App\Application\Assembly;

use App\Domain\Factory\Models\InventoryTransaction;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\StockLevel;
use App\Domain\Factory\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class AssemblyInventoryService
{
    public function deductComponent(int $productId, float $quantity, string $reference): void
    {
        if ($quantity <= 0) {
            return;
        }

        DB::transaction(function () use ($productId, $quantity, $reference): void {
            $warehouse = $this->defaultWarehouse();
            $level = StockLevel::query()->firstOrCreate(
                [
                    'warehouse_id' => $warehouse->id,
                    'item_type' => Product::class,
                    'item_id' => $productId,
                ],
                ['quantity' => 0, 'unit' => 'piece']
            );

            $level->quantity = max(0, (float) $level->quantity - $quantity);
            $level->save();

            InventoryTransaction::query()->create([
                'warehouse_id' => $warehouse->id,
                'item_type' => Product::class,
                'item_id' => $productId,
                'transaction_type' => 'assembly_issue',
                'quantity' => -abs($quantity),
                'unit' => $level->unit ?? 'piece',
                'notes' => 'صرف مكوّن تجميع — '.$reference,
            ]);
        });
    }

    public function addFinishedProduct(int $productId, float $quantity, string $reference): void
    {
        if ($quantity <= 0) {
            return;
        }

        DB::transaction(function () use ($productId, $quantity, $reference): void {
            $warehouse = $this->defaultWarehouse();
            $level = StockLevel::query()->firstOrCreate(
                [
                    'warehouse_id' => $warehouse->id,
                    'item_type' => Product::class,
                    'item_id' => $productId,
                ],
                ['quantity' => 0, 'unit' => 'piece']
            );

            $level->quantity = (float) $level->quantity + $quantity;
            $level->save();

            InventoryTransaction::query()->create([
                'warehouse_id' => $warehouse->id,
                'item_type' => Product::class,
                'item_id' => $productId,
                'transaction_type' => 'assembly_receipt',
                'quantity' => abs($quantity),
                'unit' => $level->unit ?? 'piece',
                'notes' => 'استلام منتج مجمّع — '.$reference,
            ]);
        });
    }

    private function defaultWarehouse(): Warehouse
    {
        return Warehouse::query()->firstOrCreate(
            ['code' => 'MAIN'],
            ['name' => 'المستودع الرئيسي', 'is_active' => true]
        );
    }
}
