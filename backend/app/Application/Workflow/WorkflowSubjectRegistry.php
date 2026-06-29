<?php

namespace App\Application\Workflow;

use App\Application\Workflow\Adapters\CustomerComplaintAdapter;
use App\Application\Workflow\Adapters\CustomerOrderAdapter;
use App\Application\Workflow\Adapters\HrRequestAdapter;
use App\Application\Workflow\Adapters\InventoryTransferAdapter;
use App\Application\Workflow\Adapters\MachineAdapter;
use App\Application\Workflow\Adapters\MaintenanceTicketAdapter;
use App\Application\Workflow\Adapters\PurchaseRequestAdapter;
use App\Application\Workflow\Adapters\QualityInspectionAdapter;
use App\Application\Workflow\Adapters\SupplierRequestAdapter;
use App\Application\Workflow\Adapters\WorkOrderAdapter;
use App\Application\Workflow\Contracts\WorkflowSubjectAdapter;
use App\Domain\Factory\Models\WorkflowInstance;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class WorkflowSubjectRegistry
{
    /** @var array<string, WorkflowSubjectAdapter> */
    private array $byType = [];

    /** @var array<class-string, WorkflowSubjectAdapter> */
    private array $byClass = [];

    public function __construct()
    {
        foreach ($this->adapters() as $adapter) {
            $this->byType[$adapter->subjectType()] = $adapter;
            $this->byClass[$adapter->modelClass()] = $adapter;
        }
    }

    /**
     * @return list<WorkflowSubjectAdapter>
     */
    public function adapters(): array
    {
        return [
            new WorkOrderAdapter,
            new MaintenanceTicketAdapter,
            new QualityInspectionAdapter,
            new MachineAdapter,
            new CustomerOrderAdapter,
            new PurchaseRequestAdapter,
            new InventoryTransferAdapter,
            new HrRequestAdapter,
            new SupplierRequestAdapter,
            new CustomerComplaintAdapter,
        ];
    }

    /**
     * @return list<array{type: string, label: string, defaultTemplateCode: ?string}>
     */
    public function catalog(): array
    {
        return array_map(fn (WorkflowSubjectAdapter $a) => [
            'type' => $a->subjectType(),
            'label' => $this->typeLabel($a->subjectType()),
            'defaultTemplateCode' => $a->defaultTemplateCode(),
        ], $this->adapters());
    }

    public function resolveModelClass(string $subjectType): string
    {
        if (! isset($this->byType[$subjectType])) {
            throw ValidationException::withMessages(['subjectType' => ['نوع الكيان غير مدعوم.']]);
        }

        return $this->byType[$subjectType]->modelClass();
    }

    public function onCompleted(WorkflowInstance $instance): void
    {
        $adapter = $this->adapterForInstance($instance);
        $adapter?->onWorkflowCompleted($instance);
    }

    public function onRejected(WorkflowInstance $instance): void
    {
        $adapter = $this->adapterForInstance($instance);
        $adapter?->onWorkflowRejected($instance);
    }

    /**
     * @return array{label: string, href?: string, code?: string, type: string}|null
     */
    public function summarize(WorkflowInstance $instance): ?array
    {
        if (! $instance->subject) {
            return null;
        }

        $adapter = $this->byClass[$instance->subject::class] ?? null;
        if (! $adapter) {
            return null;
        }

        return array_merge($adapter->subjectSummary($instance->subject), [
            'type' => $adapter->subjectType(),
        ]);
    }

    private function adapterForInstance(WorkflowInstance $instance): ?WorkflowSubjectAdapter
    {
        if (! $instance->subject) {
            return null;
        }

        return $this->byClass[$instance->subject::class] ?? null;
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            'work_order' => 'أمر إنتاج',
            'maintenance_ticket' => 'طلب صيانة',
            'quality_inspection' => 'فحص جودة',
            'machine' => 'آلة',
            'customer_order' => 'طلب عميل',
            'purchase_request' => 'طلب شراء',
            'inventory_transfer' => 'نقل مخزون',
            'hr_request' => 'طلب موارد بشرية',
            'supplier_request' => 'طلب مورد',
            'customer_complaint' => 'شكوى عميل',
            default => $type,
        };
    }
}
