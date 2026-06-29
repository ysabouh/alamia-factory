<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Workflow;

use App\Application\Workflow\WorkflowRequestService;
use App\Domain\Factory\Models\CustomerComplaint;
use App\Domain\Factory\Models\HrRequest;
use App\Domain\Factory\Models\InventoryTransfer;
use App\Domain\Factory\Models\PurchaseRequest;
use App\Domain\Factory\Models\SupplierRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowIntegrationRequestsController
{
    public function __construct(
        private readonly WorkflowRequestService $requests,
    ) {}

    public function purchaseIndex(): JsonResponse
    {
        return $this->list(PurchaseRequest::class);
    }

    public function purchaseStore(Request $request): JsonResponse
    {
        return $this->store($request, PurchaseRequest::class, 'PR');
    }

    public function inventoryIndex(): JsonResponse
    {
        return $this->list(InventoryTransfer::class);
    }

    public function inventoryStore(Request $request): JsonResponse
    {
        return $this->store($request, InventoryTransfer::class, 'IT');
    }

    public function hrIndex(): JsonResponse
    {
        return $this->list(HrRequest::class);
    }

    public function hrStore(Request $request): JsonResponse
    {
        return $this->store($request, HrRequest::class, 'HR');
    }

    public function supplierIndex(): JsonResponse
    {
        return $this->list(SupplierRequest::class);
    }

    public function supplierStore(Request $request): JsonResponse
    {
        return $this->store($request, SupplierRequest::class, 'SR');
    }

    public function complaintIndex(): JsonResponse
    {
        return $this->list(CustomerComplaint::class);
    }

    public function complaintStore(Request $request): JsonResponse
    {
        return $this->store($request, CustomerComplaint::class, 'CC');
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function list(string $modelClass): JsonResponse
    {
        $rows = $modelClass::query()
            ->with(['department', 'requestedBy', 'workflowInstance'])
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $rows->map(fn ($r) => $this->serialize($r))->values()->all(),
        ]);
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function store(Request $request, string $modelClass, string $prefix): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'departmentId' => ['nullable', 'integer', 'exists:departments,id'],
            'requestedByEmployeeId' => ['nullable', 'integer', 'exists:employees,id'],
            'templateId' => ['nullable', 'integer', 'exists:workflow_templates,id'],
            'priority' => ['nullable', 'string'],
        ]);

        $row = $this->requests->create($modelClass, $prefix, $data);

        return response()->json($this->serialize($row), 201);
    }

  private function serialize(Model $r): array
    {
        return [
            'id' => $r->id,
            'requestNumber' => $r->request_number,
            'title' => $r->title,
            'description' => $r->description,
            'status' => $r->status,
            'departmentId' => $r->department_id,
            'requestedByEmployeeId' => $r->requested_by_employee_id,
            'workflowInstanceId' => $r->workflow_instance_id,
            'workflowNumber' => $r->relationLoaded('workflowInstance') ? $r->workflowInstance?->workflow_number : null,
        ];
    }
}
