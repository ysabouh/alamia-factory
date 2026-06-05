<?php

namespace App\Application\Quality;

use App\Domain\Factory\Enums\ChecklistItemType;
use App\Domain\Factory\Enums\InspectionResultStatus;
use App\Domain\Factory\Enums\InspectionStatus;
use App\Domain\Factory\Enums\WorkOrderStatus;
use App\Domain\Factory\Models\QualityChecklistItem;
use App\Domain\Factory\Models\QualityInspection;
use App\Domain\Factory\Models\QualityInspectionDefect;
use App\Domain\Factory\Models\QualityInspectionResult;
use App\Domain\Factory\Models\User;
use App\Domain\Factory\Models\WorkOrder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class QualityInspectionService
{
    public function __construct(
        private readonly QualityChecklistService $checklists,
    ) {}

    /**
     * @return Collection<int, QualityInspection>
     */
    public function listForOrder(int $workOrderId): Collection
    {
        return QualityInspection::query()
            ->where('work_order_id', $workOrderId)
            ->with(['results.checklistItem', 'photos', 'defectLinks.defect', 'qualityEmployee'])
            ->orderByDesc('inspection_time')
            ->get();
    }

    public function find(int $id): QualityInspection
    {
        return QualityInspection::query()
            ->with(['results.checklistItem', 'photos', 'defectLinks.defect', 'qualityEmployee', 'workOrder.product'])
            ->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(int $workOrderId, array $data, ?int $userId): QualityInspection
    {
        $order = WorkOrder::query()->with('product')->findOrFail($workOrderId);

        return DB::transaction(function () use ($order, $data, $userId): QualityInspection {
            $checklist = $this->checklists->activeForProduct((int) $order->product_id);
            if ($checklist === null) {
                throw new InvalidArgumentException('لا يوجد قالب فحص جودة نشط لهذا المنتج.');
            }

            $qualityEmployeeId = $this->resolveQualityEmployeeId($data, $userId);

            $inspection = QualityInspection::query()->create([
                'work_order_id' => $order->id,
                'quality_employee_id' => $qualityEmployeeId,
                'inspector_id' => $qualityEmployeeId,
                'inspection_time' => $data['inspectionTime'] ?? now(),
                'status' => InspectionStatus::Passed,
                'result' => 'passed',
                'sample_size' => (int) ($data['sampleSize'] ?? 0),
                'notes' => $data['notes'] ?? null,
                'corrective_action' => $data['correctiveAction'] ?? null,
                'is_final' => (bool) ($data['isFinal'] ?? false),
            ]);

            $results = $data['results'] ?? [];
            if ($results === []) {
                foreach ($checklist->items as $item) {
                    $results[] = ['checklistItemId' => $item->id, 'measuredValue' => null, 'resultStatus' => 'pass'];
                }
            }

            $status = $this->syncResults($inspection, $results);
            $inspection->update([
                'status' => $status,
                'result' => $status->value,
            ]);

            if (! empty($data['defects']) && is_array($data['defects'])) {
                $this->syncDefects($inspection, $data['defects']);
            }

            if ($status === InspectionStatus::Failed && $order->status === WorkOrderStatus::Running) {
                $order->update(['status' => WorkOrderStatus::Paused]);
            }

            return $this->find($inspection->id);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(QualityInspection $inspection, array $data): QualityInspection
    {
        return DB::transaction(function () use ($inspection, $data): QualityInspection {
            if (array_key_exists('notes', $data)) {
                $inspection->notes = $data['notes'];
            }
            if (array_key_exists('correctiveAction', $data)) {
                $inspection->corrective_action = $data['correctiveAction'];
            }
            if (array_key_exists('isFinal', $data)) {
                $inspection->is_final = (bool) $data['isFinal'];
            }
            if (array_key_exists('sampleSize', $data)) {
                $inspection->sample_size = (int) $data['sampleSize'];
            }
            if (array_key_exists('qualityEmployeeId', $data)) {
                $qualityEmployeeId = $data['qualityEmployeeId'] !== null ? (int) $data['qualityEmployeeId'] : null;
                $inspection->quality_employee_id = $qualityEmployeeId;
                $inspection->inspector_id = $qualityEmployeeId;
            }

            if (! empty($data['results']) && is_array($data['results'])) {
                $status = $this->syncResults($inspection, $data['results']);
                $inspection->status = $status;
                $inspection->result = $status->value;

                if ($status === InspectionStatus::Failed && $inspection->workOrder?->status === WorkOrderStatus::Running) {
                    $inspection->workOrder->update(['status' => WorkOrderStatus::Paused]);
                }
            }

            $inspection->save();

            if (array_key_exists('defects', $data)) {
                $this->syncDefects($inspection, $data['defects'] ?? []);
            }

            return $this->find($inspection->id);
        });
    }

    /**
     * @param  list<array<string, mixed>>  $results
     */
    private function syncResults(QualityInspection $inspection, array $results): InspectionStatus
    {
        QualityInspectionResult::query()->where('quality_inspection_id', $inspection->id)->delete();

        $overall = InspectionStatus::Passed;
        $hasWarning = false;

        foreach ($results as $row) {
            $itemId = (int) ($row['checklistItemId'] ?? 0);
            if ($itemId <= 0) {
                continue;
            }

            $item = QualityChecklistItem::query()->find($itemId);
            if ($item === null) {
                continue;
            }

            $measured = $row['measuredValue'] ?? null;
            $resultStatus = $this->evaluateResult($item, $measured, $row['resultStatus'] ?? null);

            QualityInspectionResult::query()->create([
                'quality_inspection_id' => $inspection->id,
                'checklist_item_id' => $itemId,
                'measured_value' => $measured !== null ? (string) $measured : null,
                'result_status' => $resultStatus,
                'notes' => $row['notes'] ?? null,
            ]);

            if ($resultStatus === InspectionResultStatus::Fail) {
                if ($item->is_critical) {
                    $overall = InspectionStatus::Failed;
                } elseif ($overall !== InspectionStatus::Failed) {
                    $hasWarning = true;
                }
            } elseif ($resultStatus === InspectionResultStatus::Warning && $overall !== InspectionStatus::Failed) {
                $hasWarning = true;
            }
        }

        if ($overall !== InspectionStatus::Failed && $hasWarning) {
            return InspectionStatus::Warning;
        }

        return $overall;
    }

    private function evaluateResult(QualityChecklistItem $item, mixed $measured, ?string $manualStatus): InspectionResultStatus
    {
        if ($manualStatus !== null) {
            return InspectionResultStatus::tryFrom($manualStatus) ?? InspectionResultStatus::Pass;
        }

        $type = $item->item_type;
        if ($type === ChecklistItemType::Boolean) {
            $val = filter_var($measured, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val === false) {
                return InspectionResultStatus::Fail;
            }

            return InspectionResultStatus::Pass;
        }

        if ($type === ChecklistItemType::Numeric && $measured !== null && $measured !== '') {
            $num = (float) $measured;
            $min = $item->min_value !== null ? (float) $item->min_value : null;
            $max = $item->max_value !== null ? (float) $item->max_value : null;

            if (($min !== null && $num < $min) || ($max !== null && $num > $max)) {
                return InspectionResultStatus::Fail;
            }

            return InspectionResultStatus::Pass;
        }

        return InspectionResultStatus::Pass;
    }

    /**
     * @param  list<array<string, mixed>>  $defects
     */
    private function syncDefects(QualityInspection $inspection, array $defects): void
    {
        QualityInspectionDefect::query()->where('quality_inspection_id', $inspection->id)->delete();

        foreach ($defects as $row) {
            $defectId = (int) ($row['defectId'] ?? 0);
            if ($defectId <= 0) {
                continue;
            }

            QualityInspectionDefect::query()->create([
                'quality_inspection_id' => $inspection->id,
                'defect_id' => $defectId,
                'quantity' => (int) ($row['quantity'] ?? 1),
                'notes' => $row['notes'] ?? null,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveQualityEmployeeId(array $data, ?int $userId): ?int
    {
        if (! empty($data['qualityEmployeeId'])) {
            return (int) $data['qualityEmployeeId'];
        }

        if ($userId === null) {
            return null;
        }

        $employeeId = User::query()->whereKey($userId)->value('employee_id');

        return $employeeId ? (int) $employeeId : null;
    }
}
