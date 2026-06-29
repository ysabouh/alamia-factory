<?php

namespace App\Interfaces\Http\Support;

use App\Domain\Factory\Models\QualityChecklist;
use App\Domain\Factory\Models\QualityChecklistItem;
use App\Domain\Factory\Models\QualityDefect;
use App\Domain\Factory\Models\QualityInspection;
use App\Domain\Factory\Models\QualityInspectionDefect;
use App\Domain\Factory\Models\QualityInspectionPhoto;
use App\Domain\Factory\Models\QualityInspectionResult;
use App\Domain\Factory\Models\MachineDowntime;
use App\Domain\Factory\Models\MachineDowntimePhoto;
use App\Domain\Factory\Models\DowntimeReason;

trait SerializesQuality
{
    /**
     * @return array<string, mixed>
     */
    protected function serializeChecklist(QualityChecklist $checklist): array
    {
        return [
            'id' => (string) $checklist->id,
            'productId' => (string) $checklist->product_id,
            'name' => $checklist->name,
            'description' => $checklist->description,
            'isActive' => (bool) $checklist->is_active,
            'items' => $checklist->relationLoaded('items')
                ? $checklist->items->map(fn (QualityChecklistItem $i) => $this->serializeChecklistItem($i))->values()->all()
                : [],
            'createdAt' => $checklist->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeChecklistItem(QualityChecklistItem $item): array
    {
        return [
            'id' => (string) $item->id,
            'checklistId' => (string) $item->checklist_id,
            'itemName' => $item->item_name,
            'itemType' => $item->item_type?->value ?? $item->item_type,
            'minValue' => $item->min_value,
            'maxValue' => $item->max_value,
            'unit' => $item->unit,
            'selectionOptions' => $item->selection_options,
            'sortOrder' => $item->sort_order,
            'isRequired' => (bool) $item->is_required,
            'isCritical' => (bool) $item->is_critical,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeInspection(QualityInspection $inspection): array
    {
        return [
            'id' => (string) $inspection->id,
            'workOrderId' => $inspection->work_order_id ? (string) $inspection->work_order_id : null,
            'qualityEmployeeId' => $inspection->quality_employee_id ? (string) $inspection->quality_employee_id : null,
            'qualityEmployeeName' => $inspection->qualityEmployee?->full_name ?? $inspection->qualityEmployee?->name,
            'inspectionTime' => $inspection->inspection_time?->toIso8601String(),
            'status' => $inspection->status?->value ?? $inspection->status ?? $inspection->result,
            'sampleSize' => $inspection->sample_size,
            'notes' => $inspection->notes,
            'correctiveAction' => $inspection->corrective_action,
            'isFinal' => (bool) $inspection->is_final,
            'results' => $inspection->relationLoaded('results')
                ? $inspection->results->map(fn (QualityInspectionResult $r) => $this->serializeInspectionResult($r))->values()->all()
                : [],
            'photos' => $inspection->relationLoaded('photos')
                ? $inspection->photos->map(fn (QualityInspectionPhoto $p) => $this->serializeInspectionPhoto($p))->values()->all()
                : [],
            'defects' => $inspection->relationLoaded('defectLinks')
                ? $inspection->defectLinks->map(fn (QualityInspectionDefect $d) => $this->serializeInspectionDefect($d))->values()->all()
                : [],
            'createdAt' => $inspection->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeInspectionResult(QualityInspectionResult $result): array
    {
        return [
            'id' => (string) $result->id,
            'checklistItemId' => (string) $result->checklist_item_id,
            'itemName' => $result->checklistItem?->item_name,
            'itemType' => $result->checklistItem?->item_type?->value ?? $result->checklistItem?->item_type,
            'measuredValue' => $result->measured_value,
            'resultStatus' => $result->result_status?->value ?? $result->result_status,
            'notes' => $result->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeInspectionPhoto(QualityInspectionPhoto $photo): array
    {
        return [
            'id' => (string) $photo->id,
            'filePath' => $photo->file_path,
            'fileName' => $photo->file_name,
            'uploadedAt' => $photo->uploaded_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeInspectionDefect(QualityInspectionDefect $link): array
    {
        return [
            'id' => (string) $link->id,
            'defectId' => (string) $link->defect_id,
            'defectCode' => $link->defect?->code,
            'defectName' => $link->defect?->name,
            'quantity' => $link->quantity,
            'notes' => $link->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeDefectCatalog(QualityDefect $defect): array
    {
        return [
            'id' => (string) $defect->id,
            'code' => $defect->code,
            'name' => $defect->name,
            'description' => $defect->description,
            'isActive' => (bool) $defect->is_active,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeDowntime(MachineDowntime $downtime): array
    {
        return [
            'id' => (string) $downtime->id,
            'workOrderId' => $downtime->work_order_id ? (string) $downtime->work_order_id : null,
            'machineId' => (string) $downtime->machine_id,
            'startTime' => $downtime->start_time?->toIso8601String(),
            'endTime' => $downtime->end_time?->toIso8601String(),
            'downtimeMinutes' => $downtime->downtime_minutes,
            'downtimeReasonId' => $downtime->downtime_reason_id ? (string) $downtime->downtime_reason_id : null,
            'reasonCode' => $downtime->reason?->code,
            'reasonName' => $downtime->reason?->name,
            'notes' => $downtime->notes,
            'faultDescription' => $downtime->fault_description,
            'repairMethod' => $downtime->repair_method,
            'maintenanceTicketId' => $downtime->maintenanceTicket?->id ? (string) $downtime->maintenanceTicket->id : null,
            'requestNo' => $downtime->maintenanceTicket?->request_no,
            'photos' => $downtime->relationLoaded('photos')
                ? $downtime->photos->map(fn (MachineDowntimePhoto $p) => $this->serializeDowntimePhoto($p))->values()->all()
                : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeDowntimePhoto(MachineDowntimePhoto $photo): array
    {
        return [
            'id' => (string) $photo->id,
            'filePath' => $photo->file_path,
            'fileName' => $photo->file_name,
            'uploadedAt' => $photo->uploaded_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function serializeDowntimeReason(DowntimeReason $reason): array
    {
        return [
            'id' => (string) $reason->id,
            'code' => $reason->code,
            'name' => $reason->name,
        ];
    }
}
