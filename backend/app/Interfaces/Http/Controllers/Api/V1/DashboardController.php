<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Dashboard\GetLiveDashboard;
use Illuminate\Http\JsonResponse;

class DashboardController
{
    public function live(GetLiveDashboard $dashboard): JsonResponse
    {
        return response()->json($dashboard->handle());
    }
}
