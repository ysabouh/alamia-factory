<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Maintenance\OpenMaintenanceTicket;
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
        OpenMaintenanceTicket $openTicket
    ): MaintenanceTicketResource {
        return MaintenanceTicketResource::make(
            $openTicket->handle($request->validated(), $request->user()?->id)->load('machine')
        );
    }
}
