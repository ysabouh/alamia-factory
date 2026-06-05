<?php

namespace App\Application\Assembly;

use App\Application\Products\ProductBomService;
use App\Domain\Factory\Enums\AssemblyWorkOrderStatus;
use App\Domain\Factory\Models\AssemblyComponentConsumption;
use App\Domain\Factory\Models\AssemblyOperation;
use App\Domain\Factory\Models\AssemblyWorkOrder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AssemblyOperationService
{
    public function __construct(
        private readonly ProductBomService $bom,
        private readonly AssemblyInventoryService $inventory,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function record(array $data): AssemblyOperation
    {
        return DB::transaction(function () use ($data): AssemblyOperation {
            $wo = AssemblyWorkOrder::query()->lockForUpdate()->findOrFail((int) $data['assemblyWorkOrderId']);
            $produced = (int) ($data['quantityProduced'] ?? 0);
            $rejected = (int) ($data['quantityRejected'] ?? 0);

            if ($produced <= 0) {
                throw new InvalidArgumentException('كمية الإنتاج يجب أن تكون أكبر من صفر.');
            }

            $start = isset($data['assemblyStartTime']) ? now()->parse($data['assemblyStartTime']) : now();
            $end = isset($data['assemblyEndTime']) ? now()->parse($data['assemblyEndTime']) : now();
            $duration = (int) $start->diffInSeconds($end);

            $operation = AssemblyOperation::query()->create([
                'assembly_work_order_id' => $wo->id,
                'product_id' => $wo->final_product_id,
                'quantity_produced' => $produced,
                'quantity_rejected' => $rejected,
                'operator_id' => ! empty($data['operatorId']) ? (int) $data['operatorId'] : null,
                'machine_id' => ! empty($data['machineId']) ? (int) $data['machineId'] : null,
                'assembly_start_time' => $start,
                'assembly_end_time' => $end,
                'production_duration' => $duration,
                'notes' => $data['notes'] ?? null,
            ]);

            $exploded = $this->bom->explode((int) $wo->final_product_id, (float) $produced);

            foreach ($exploded as $row) {
                $planned = (float) $row['quantity'];
                $actual = $planned;
                $waste = 0.0;

                AssemblyComponentConsumption::query()->create([
                    'assembly_operation_id' => $operation->id,
                    'component_product_id' => (int) $row['productId'],
                    'planned_quantity' => $planned,
                    'actual_quantity' => $actual,
                    'waste_quantity' => $waste,
                ]);

                $this->inventory->deductComponent((int) $row['productId'], $actual + $waste, 'assembly:'.$operation->id);
            }

            $this->inventory->addFinishedProduct((int) $wo->final_product_id, (float) $produced, 'assembly:'.$operation->id);

            $wo->completed_quantity = (int) $wo->completed_quantity + $produced;
            if ($wo->status === AssemblyWorkOrderStatus::Planned || $wo->status === AssemblyWorkOrderStatus::Draft) {
                $wo->status = AssemblyWorkOrderStatus::InProgress;
                $wo->actual_start_date = $wo->actual_start_date ?? now();
            }
            if ($wo->completed_quantity >= $wo->planned_quantity) {
                $wo->status = AssemblyWorkOrderStatus::Completed;
                $wo->actual_end_date = now();
            }
            $wo->save();

            return $operation->load(['consumptions.componentProduct', 'operator', 'machine']);
        });
    }
}
