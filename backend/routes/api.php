<?php

use App\Interfaces\Http\Controllers\Api\V1\AuthController;
use App\Interfaces\Http\Controllers\Api\V1\DashboardController;
use App\Interfaces\Http\Controllers\Api\V1\MachineController;
use App\Interfaces\Http\Controllers\Api\V1\MaintenanceController;
use App\Interfaces\Http\Controllers\Api\V1\ProductionController;
use App\Interfaces\Http\Controllers\Api\V1\WorkforceController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);

    Route::get('dashboard/live', [DashboardController::class, 'live'])->middleware('can:analytics.view');

    Route::get('workforce/roster', [WorkforceController::class, 'roster'])->middleware('can:workforce.view');
    Route::get('workforce/meta', [WorkforceController::class, 'meta'])->middleware('can:workforce.view');
    Route::patch('workforce/employees/{employee}/placement', [WorkforceController::class, 'updatePlacement'])->middleware('can:workforce.manage_placement');

    Route::get('machines', [MachineController::class, 'index'])->middleware('can:machines.view');
    Route::patch('machines/{machine}/status', [MachineController::class, 'updateStatus']);

    Route::post('production/assignments', [ProductionController::class, 'assign']);
    Route::post('production/entries', [ProductionController::class, 'storeEntry']);
    Route::post('production/waste', [ProductionController::class, 'storeWaste']);
    Route::get('production/reports/daily', [ProductionController::class, 'dailyReport'])->middleware('can:production.reports');

    Route::get('maintenance/tickets', [MaintenanceController::class, 'index'])->middleware('can:maintenance.open_ticket');
    Route::post('maintenance/tickets', [MaintenanceController::class, 'store']);
});
