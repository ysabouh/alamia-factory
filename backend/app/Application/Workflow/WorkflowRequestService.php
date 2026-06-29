<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Models\CustomerComplaint;
use App\Domain\Factory\Models\HrRequest;
use App\Domain\Factory\Models\InventoryTransfer;
use App\Domain\Factory\Models\PurchaseRequest;
use App\Domain\Factory\Models\SupplierRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class WorkflowRequestService
{
    public function __construct(
        private readonly WorkflowNumberGenerator $numbers,
        private readonly WorkflowExecutionService $execution,
    ) {}

    /**
     * @param  class-string<Model>  $modelClass
     * @param  array<string, mixed>  $data
     */
    public function create(string $modelClass, string $numberPrefix, array $data): Model
    {
        return DB::transaction(function () use ($modelClass, $numberPrefix, $data): Model {
            /** @var Model $request */
            $request = $modelClass::query()->create([
                'request_number' => $this->numbers->nextRequestNumber($numberPrefix),
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'status' => 'pending',
                'department_id' => $data['departmentId'] ?? null,
                'requested_by_employee_id' => $data['requestedByEmployeeId'] ?? null,
            ]);

            if (! empty($data['templateId'])) {
                $instance = $this->execution->start([
                    'templateId' => $data['templateId'],
                    'subjectType' => $this->subjectTypeFor($modelClass),
                    'subjectId' => $request->getKey(),
                    'priority' => $data['priority'] ?? null,
                ]);
                $request->update(['workflow_instance_id' => $instance->id]);
            }

            return $request->fresh(['workflowInstance', 'department', 'requestedBy']);
        });
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function subjectTypeFor(string $modelClass): string
    {
        return match ($modelClass) {
            PurchaseRequest::class => 'purchase_request',
            InventoryTransfer::class => 'inventory_transfer',
            HrRequest::class => 'hr_request',
            SupplierRequest::class => 'supplier_request',
            CustomerComplaint::class => 'customer_complaint',
            default => 'custom',
        };
    }
}
