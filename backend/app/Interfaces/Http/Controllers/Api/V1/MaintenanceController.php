<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Maintenance\OpenMaintenanceTicket;
use App\Application\Workflow\WorkflowExecutionService;
use App\Domain\Factory\Models\WorkflowTemplate;
use App\Domain\Factory\Models\MaintenanceTicket;
use App\Interfaces\Http\Requests\OpenMaintenanceTicketRequest;
use App\Interfaces\Http\Resources\MaintenanceTicketResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MaintenanceController
{
    public function index(): AnonymousResourceCollection
    {
        return MaintenanceTicketResource::collection(
            MaintenanceTicket::query()->with('machine')->latest()->paginate()
        );
    }

    public function store(
        OpenMaintenanceTicketRequest $request,
        OpenMaintenanceTicket $openTicket,
        WorkflowExecutionService $workflow,
    ): MaintenanceTicketResource {
        $ticket = $openTicket->handle($request->validated(), $request->user()?->id)->load('machine');

        if ($request->boolean('startWorkflow')) {
            $template = WorkflowTemplate::query()
                ->where('code', $request->input('workflowTemplateCode', 'MAINTENANCE_REQUEST'))
                ->where('is_active', true)
                ->first();

            if ($template?->published_version_id) {
                $instance = $workflow->start([
                    'templateId' => $template->id,
                    'subjectType' => 'maintenance_ticket',
                    'subjectId' => $ticket->id,
                ]);
                $ticket->setAttribute('workflow_instance_id', $instance->id);
            }
        }

        return MaintenanceTicketResource::make($ticket);
    }
}
