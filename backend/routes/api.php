<?php

use App\Interfaces\Http\Controllers\Api\V1\AuthController;
use App\Interfaces\Http\Controllers\Api\V1\DashboardController;
use App\Interfaces\Http\Controllers\Api\V1\MachineController;
use App\Interfaces\Http\Controllers\Api\V1\MoldController;
use App\Interfaces\Http\Controllers\Api\V1\Molds\MoldImagesController;
use App\Interfaces\Http\Controllers\Api\V1\Machines\MachineCountersController;
use App\Interfaces\Http\Controllers\Api\V1\Machines\MachineMaintenanceController;
use App\Interfaces\Http\Controllers\Api\V1\Machines\MachineTypesController;
use App\Interfaces\Http\Controllers\Api\V1\MaintenanceController;
use App\Interfaces\Http\Controllers\Api\V1\ProductController;
use App\Interfaces\Http\Controllers\Api\V1\Assembly\AssemblyWorkOrderController;
use App\Interfaces\Http\Controllers\Api\V1\Products\ProductBomController;
use App\Interfaces\Http\Controllers\Api\V1\Products\ProductDocumentsController;
use App\Interfaces\Http\Controllers\Api\V1\Products\ProductImagesController;
use App\Interfaces\Http\Controllers\Api\V1\Products\ProductOperationController;
use App\Interfaces\Http\Controllers\Api\V1\ProductionController;
use App\Interfaces\Http\Controllers\Api\V1\Production\WorkOrderController;
use App\Interfaces\Http\Controllers\Api\V1\Production\MachineDowntimeController;
use App\Interfaces\Http\Controllers\Api\V1\Quality\QualityChecklistController;
use App\Interfaces\Http\Controllers\Api\V1\Quality\QualityInspectionController;
use App\Interfaces\Http\Controllers\Api\V1\UsersController;
use App\Interfaces\Http\Controllers\Api\V1\Masters\DepartmentsMasterController;
use App\Interfaces\Http\Controllers\Api\V1\Masters\HallsMasterController;
use App\Interfaces\Http\Controllers\Api\V1\Masters\JobRolesMasterController;
use App\Interfaces\Http\Controllers\Api\V1\Masters\CurrenciesMasterController;
use App\Interfaces\Http\Controllers\Api\V1\Masters\ShiftsMasterController;
use App\Interfaces\Http\Controllers\Api\V1\Attendance\AttendanceController;
use App\Interfaces\Http\Controllers\Api\V1\Attendance\EmployeeShiftsController;
use App\Interfaces\Http\Controllers\Api\V1\Attendance\OvertimeRequestsController;
use App\Interfaces\Http\Controllers\Api\V1\Attendance\PayrollsController;
use App\Interfaces\Http\Controllers\Api\V1\WorkforceController;
use App\Interfaces\Http\Controllers\Api\V1\WorkforceEmployeesController;
use Illuminate\Support\Facades\Route;

/**
 * قراءة سجل الموظفين والمرجعيات بدون توكن — ‎APP_ENV=local‎ فقط.
 * الافتراضي ‎true‎ لتسهيل التطوير؛ عطّل بـ ‎WORKFORCE_PUBLIC_READ=false‎ في ‎.env‎.
 */
$publicWorkforceRead = app()->environment('local')
    && filter_var(env('WORKFORCE_PUBLIC_READ', true), FILTER_VALIDATE_BOOLEAN);

if ($publicWorkforceRead) {
    Route::get('workforce/meta', [WorkforceController::class, 'meta']);
    Route::get('workforce/employees', [WorkforceEmployeesController::class, 'index']);
    Route::get('workforce/employees/{employee}', [WorkforceEmployeesController::class, 'show']);
}

Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () use ($publicWorkforceRead): void {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);

    Route::get('users/permissions-catalog', [UsersController::class, 'permissionsCatalog'])->middleware('can:users.manage');
    Route::get('users', [UsersController::class, 'index'])->middleware('can:users.manage');
    Route::get('users/{user}', [UsersController::class, 'show'])->middleware('can:users.manage');
    Route::patch('users/{user}', [UsersController::class, 'update'])->middleware('can:users.manage');
    Route::post('users/link-employee', [UsersController::class, 'linkEmployee'])->middleware('can:users.manage');
    Route::post('users/link-existing', [UsersController::class, 'linkExistingUser'])->middleware('can:users.manage');

    Route::get('dashboard/live', [DashboardController::class, 'live'])->middleware('can:analytics.view');

    Route::get('workforce/roster', [WorkforceController::class, 'roster'])->middleware('can:workforce.view');
    if (! $publicWorkforceRead) {
        Route::get('workforce/meta', [WorkforceController::class, 'meta'])->middleware('can:workforce.view');
    }
    Route::patch('workforce/employees/{employee}/placement', [WorkforceController::class, 'updatePlacement'])->middleware('can:workforce.manage_placement');

    Route::prefix('workforce/masters')->group(function (): void {
        $read = 'can:workforce.view';
        $write = 'can:workforce.manage_masters';

        Route::get('halls', [HallsMasterController::class, 'index'])->middleware($read);
        Route::get('halls/{hall}', [HallsMasterController::class, 'show'])->middleware($read);
        Route::post('halls', [HallsMasterController::class, 'store'])->middleware($write);
        Route::patch('halls/{hall}', [HallsMasterController::class, 'update'])->middleware($write);
        Route::patch('halls/{hall}/activate', [HallsMasterController::class, 'activate'])->middleware($write);
        Route::patch('halls/{hall}/deactivate', [HallsMasterController::class, 'deactivate'])->middleware($write);

        Route::get('departments', [DepartmentsMasterController::class, 'index'])->middleware($read);
        Route::get('departments/{department}', [DepartmentsMasterController::class, 'show'])->middleware($read);
        Route::post('departments', [DepartmentsMasterController::class, 'store'])->middleware($write);
        Route::patch('departments/{department}', [DepartmentsMasterController::class, 'update'])->middleware($write);
        Route::patch('departments/{department}/activate', [DepartmentsMasterController::class, 'activate'])->middleware($write);
        Route::patch('departments/{department}/deactivate', [DepartmentsMasterController::class, 'deactivate'])->middleware($write);

        Route::get('job-roles', [JobRolesMasterController::class, 'index'])->middleware($read);
        Route::get('job-roles/{jobRole}', [JobRolesMasterController::class, 'show'])->middleware($read);
        Route::post('job-roles', [JobRolesMasterController::class, 'store'])->middleware($write);
        Route::patch('job-roles/{jobRole}', [JobRolesMasterController::class, 'update'])->middleware($write);
        Route::patch('job-roles/{jobRole}/activate', [JobRolesMasterController::class, 'activate'])->middleware($write);
        Route::patch('job-roles/{jobRole}/deactivate', [JobRolesMasterController::class, 'deactivate'])->middleware($write);

        Route::get('shifts', [ShiftsMasterController::class, 'index'])->middleware($read);
        Route::get('shifts/{shift}', [ShiftsMasterController::class, 'show'])->middleware($read);
        Route::post('shifts', [ShiftsMasterController::class, 'store'])->middleware($write);
        Route::patch('shifts/{shift}', [ShiftsMasterController::class, 'update'])->middleware($write);
        Route::patch('shifts/{shift}/activate', [ShiftsMasterController::class, 'activate'])->middleware($write);
        Route::patch('shifts/{shift}/deactivate', [ShiftsMasterController::class, 'deactivate'])->middleware($write);

        Route::get('currencies', [CurrenciesMasterController::class, 'index'])->middleware($read);
        Route::get('currencies/{currency}', [CurrenciesMasterController::class, 'show'])->middleware($read);
        Route::post('currencies', [CurrenciesMasterController::class, 'store'])->middleware($write);
        Route::patch('currencies/{currency}', [CurrenciesMasterController::class, 'update'])->middleware($write);
        Route::patch('currencies/{currency}/activate', [CurrenciesMasterController::class, 'activate'])->middleware($write);
        Route::patch('currencies/{currency}/deactivate', [CurrenciesMasterController::class, 'deactivate'])->middleware($write);
    });

    if (! $publicWorkforceRead) {
        Route::get('workforce/employees', [WorkforceEmployeesController::class, 'index'])->middleware('can:workforce.view');
        Route::get('workforce/employees/{employee}', [WorkforceEmployeesController::class, 'show'])->middleware('can:workforce.view');
    }
    Route::post('workforce/employees', [WorkforceEmployeesController::class, 'store'])->middleware('can:workforce.manage_employees');
    Route::patch('workforce/employees/{employee}', [WorkforceEmployeesController::class, 'update'])->middleware('can:workforce.manage_employees');
    Route::delete('workforce/employees/{employee}', [WorkforceEmployeesController::class, 'destroy'])->middleware('can:workforce.manage_employees');

    Route::prefix('workforce/attendance')->group(function (): void {
        Route::get('dashboard', [AttendanceController::class, 'dashboard'])->middleware('can:attendance.view');
        Route::get('daily', [AttendanceController::class, 'daily'])->middleware('can:attendance.view');
        Route::get('records', [AttendanceController::class, 'index'])->middleware('can:attendance.view');
        Route::post('records', [AttendanceController::class, 'store'])->middleware('can:attendance.record');
        Route::post('records/{record}/approve', [AttendanceController::class, 'approve'])->middleware('can:attendance.approve');
        Route::post('check-in', [AttendanceController::class, 'checkIn'])->middleware('can:attendance.record');
        Route::post('check-out', [AttendanceController::class, 'checkOut'])->middleware('can:attendance.record');
        Route::get('employees/{employee}/history', [AttendanceController::class, 'employeeHistory'])->middleware('can:attendance.view');
        Route::get('employees/{employee}/report', [AttendanceController::class, 'employeeReport'])->middleware('can:attendance.view');
    });

    Route::prefix('workforce/overtime')->group(function (): void {
        Route::get('requests', [OvertimeRequestsController::class, 'index'])->middleware('can:attendance.view');
        Route::post('requests', [OvertimeRequestsController::class, 'store'])->middleware('can:overtime.request');
        Route::patch('requests/{overtimeRequest}', [OvertimeRequestsController::class, 'update']);
        Route::post('requests/{overtimeRequest}/approve', [OvertimeRequestsController::class, 'approve'])->middleware('can:overtime.approve');
        Route::post('requests/{overtimeRequest}/reject', [OvertimeRequestsController::class, 'reject'])->middleware('can:overtime.approve');
        Route::post('requests/{overtimeRequest}/complete', [OvertimeRequestsController::class, 'complete'])->middleware('can:overtime.approve');
        Route::delete('requests/{overtimeRequest}', [OvertimeRequestsController::class, 'destroy'])->middleware('can:overtime.delete');
    });

    Route::prefix('workforce/payrolls')->group(function (): void {
        Route::get('/', [PayrollsController::class, 'index'])->middleware('can:payroll.view');
        Route::post('preview', [PayrollsController::class, 'preview'])->middleware('can:payroll.view');
        Route::post('generate', [PayrollsController::class, 'generate'])->middleware('can:payroll.generate');
        Route::get('{payroll}', [PayrollsController::class, 'show'])->middleware('can:payroll.view');
        Route::get('{payroll}/export', [PayrollsController::class, 'export'])->middleware('can:payroll.view');
    });

    Route::prefix('workforce/employee-shifts')->group(function (): void {
        Route::get('/', [EmployeeShiftsController::class, 'index'])->middleware('can:attendance.view');
        Route::post('/', [EmployeeShiftsController::class, 'store'])->middleware('can:shifts.assign');
    });

    Route::prefix('machines')->group(function (): void {
        Route::get('types', [MachineTypesController::class, 'index'])->middleware('can:machines.view');
        Route::post('types', [MachineTypesController::class, 'store'])->middleware('can:machines.manage');
        Route::patch('types/{machineType}', [MachineTypesController::class, 'update'])->middleware('can:machines.manage');

        Route::get('/', [MachineController::class, 'index'])->middleware('can:machines.view');
        Route::post('/', [MachineController::class, 'store'])->middleware('can:machines.manage');
        Route::get('{machine}', [MachineController::class, 'show'])->middleware('can:machines.view');
        Route::patch('{machine}', [MachineController::class, 'update'])->middleware('can:machines.manage');
        Route::delete('{machine}', [MachineController::class, 'destroy'])->middleware('can:machines.manage');
        Route::patch('{machine}/status', [MachineController::class, 'updateStatus'])->middleware('can:machines.update_status');

        Route::get('{machine}/counters', [MachineCountersController::class, 'index'])->middleware('can:machines.view');
        Route::post('{machine}/counters', [MachineCountersController::class, 'store'])->middleware('can:machines.record_counters');

        Route::get('{machine}/tickets', [MachineMaintenanceController::class, 'tickets'])->middleware('can:machines.view');
        Route::post('{machine}/tickets', [MachineMaintenanceController::class, 'storeTicket'])->middleware('can:machines.manage_maintenance');
        Route::patch('{machine}/tickets/{ticket}', [MachineMaintenanceController::class, 'updateTicket'])->middleware('can:machines.manage_maintenance');
        Route::get('{machine}/maintenance-actions', [MachineMaintenanceController::class, 'actions'])->middleware('can:machines.view');
        Route::post('{machine}/tickets/{ticket}/actions', [MachineMaintenanceController::class, 'storeAction'])->middleware('can:machines.manage_maintenance');
        Route::get('{machine}/preventive-logs', [MachineMaintenanceController::class, 'preventiveLogs'])->middleware('can:machines.view');
    });

    Route::prefix('products')->group(function (): void {
        Route::get('masters', [ProductController::class, 'masters'])->middleware('can:products.view');
        Route::get('/', [ProductController::class, 'index'])->middleware('can:products.view');
        Route::post('/', [ProductController::class, 'store'])->middleware('can:products.manage');
        Route::get('{product}', [ProductController::class, 'show'])->middleware('can:products.view');
        Route::match(['put', 'patch'], '{product}', [ProductController::class, 'update'])->middleware('can:products.manage');
        Route::delete('{product}', [ProductController::class, 'destroy'])->middleware('can:products.manage');
        Route::get('{product}/bom', [ProductBomController::class, 'index'])->middleware('can:products.view');
        Route::get('{product}/bom-tree', [ProductBomController::class, 'tree'])->middleware('can:products.view');
        Route::get('{product}/bom-explode', [ProductBomController::class, 'explode'])->middleware('can:products.view');
        Route::post('{product}/bom', [ProductBomController::class, 'store'])->middleware('can:products.manage');
        Route::get('{product}/operations', [ProductOperationController::class, 'index'])->middleware('can:products.view');
        Route::post('{product}/operations', [ProductOperationController::class, 'store'])->middleware('can:products.manage');
        Route::get('{product}/routing', [ProductOperationController::class, 'routing'])->middleware('can:products.view');
        Route::get('{product}/molds', [ProductController::class, 'molds'])->middleware('can:products.view');
        Route::get('{product}/machine-settings', [ProductController::class, 'machineSettings'])->middleware('can:products.view');
        Route::post('{product}/images', [ProductImagesController::class, 'store'])->middleware('can:products.manage');
        Route::post('{product}/documents', [ProductDocumentsController::class, 'store'])->middleware('can:products.manage');
    });

    Route::match(['put', 'patch'], 'product-bom/{productBom}', [ProductBomController::class, 'update'])->middleware('can:products.manage');
    Route::delete('product-bom/{productBom}', [ProductBomController::class, 'destroy'])->middleware('can:products.manage');

    Route::match(['put', 'patch'], 'product-operations/{productOperation}', [ProductOperationController::class, 'update'])->middleware('can:products.manage');
    Route::delete('product-operations/{productOperation}', [ProductOperationController::class, 'destroy'])->middleware('can:products.manage');

    Route::prefix('assembly')->group(function (): void {
        Route::get('dashboard', [AssemblyWorkOrderController::class, 'dashboard'])->middleware('can:assembly.view');
        Route::get('work-orders', [AssemblyWorkOrderController::class, 'index'])->middleware('can:assembly.view');
        Route::post('work-orders', [AssemblyWorkOrderController::class, 'store'])->middleware('can:assembly.manage');
        Route::get('work-orders/{assemblyWorkOrder}', [AssemblyWorkOrderController::class, 'show'])->middleware('can:assembly.view');
        Route::get('work-orders/{assemblyWorkOrder}/availability', [AssemblyWorkOrderController::class, 'availability'])->middleware('can:assembly.view');
        Route::post('operations', [AssemblyWorkOrderController::class, 'storeOperation'])->middleware('can:assembly.manage');
    });

    Route::delete('product-images/{productImage}', [ProductImagesController::class, 'destroy'])->middleware('can:products.manage');
    Route::patch('product-images/{productImage}/primary', [ProductImagesController::class, 'setPrimary'])->middleware('can:products.manage');
    Route::delete('product-documents/{productDocument}', [ProductDocumentsController::class, 'destroy'])->middleware('can:products.manage');

    Route::prefix('molds')->group(function (): void {
        Route::get('stats', [MoldController::class, 'stats'])->middleware('can:molds.view');
        Route::get('by-type/{type}', [MoldController::class, 'byType'])->middleware('can:molds.view');
        Route::get('/', [MoldController::class, 'index'])->middleware('can:molds.view');
        Route::post('/', [MoldController::class, 'store'])->middleware('can:molds.manage');
        Route::get('{mold}', [MoldController::class, 'show'])->middleware('can:molds.view');
        Route::match(['put', 'patch'], '{mold}', [MoldController::class, 'update'])->middleware('can:molds.manage');
        Route::delete('{mold}', [MoldController::class, 'destroy'])->middleware('can:molds.manage');
        Route::post('{mold}/images', [MoldImagesController::class, 'store'])->middleware('can:molds.manage');
        Route::post('{mold}/maintenance', [MoldController::class, 'storeMaintenance'])->middleware('can:molds.manage_maintenance');
    });

    Route::delete('mold-images/{moldImage}', [MoldImagesController::class, 'destroy'])->middleware('can:molds.manage');
    Route::patch('mold-images/{moldImage}/primary', [MoldImagesController::class, 'setPrimary'])->middleware('can:molds.manage');

    Route::post('production/assignments', [ProductionController::class, 'assign']);
    Route::post('production/entries', [ProductionController::class, 'storeEntry']);
    Route::post('production/waste', [ProductionController::class, 'storeWaste']);
    Route::get('production/reports/daily', [ProductionController::class, 'dailyReport'])->middleware('can:production.reports');

    Route::prefix('production')->group(function (): void {
        Route::get('dashboard/kpis', [WorkOrderController::class, 'dashboardKpis'])->middleware('can:production.reports');
        Route::get('orders', [WorkOrderController::class, 'index'])->middleware('can:production.record');
        Route::post('orders', [WorkOrderController::class, 'store'])->middleware('can:production.manage');
        Route::get('orders/{workOrder}', [WorkOrderController::class, 'show'])->middleware('can:production.record');
        Route::match(['put', 'patch'], 'orders/{workOrder}', [WorkOrderController::class, 'update'])->middleware('can:production.manage');
        Route::post('orders/{workOrder}/start', [WorkOrderController::class, 'start'])->middleware('can:production.execute');
        Route::post('orders/{workOrder}/pause', [WorkOrderController::class, 'pause'])->middleware('can:production.execute');
        Route::post('orders/{workOrder}/resume', [WorkOrderController::class, 'resume'])->middleware('can:production.execute');
        Route::post('orders/{workOrder}/complete', [WorkOrderController::class, 'complete'])->middleware('can:production.execute');
        Route::post('orders/{workOrder}/cancel', [WorkOrderController::class, 'cancel'])->middleware('can:production.manage');
        Route::get('orders/{workOrder}/workers', [WorkOrderController::class, 'workers'])->middleware('can:production.record');
        Route::get('orders/{workOrder}/workers/history', [WorkOrderController::class, 'workersHistory'])->middleware('can:production.record');
        Route::post('orders/{workOrder}/workers', [WorkOrderController::class, 'storeWorker'])->middleware('can:production.manage');
        Route::delete('orders/{workOrder}/workers/{workOrderWorker}', [WorkOrderController::class, 'removeWorker'])->middleware('can:production.manage');
        Route::get('orders/{workOrder}/logs', [WorkOrderController::class, 'logs'])->middleware('can:production.record');
        Route::post('orders/{workOrder}/logs', [WorkOrderController::class, 'storeLog'])->middleware('can:production.execute');
        Route::get('orders/{workOrder}/inspections', [QualityInspectionController::class, 'index'])->middleware('can:quality.inspect');
        Route::post('orders/{workOrder}/inspections', [QualityInspectionController::class, 'store'])->middleware('can:quality.inspect');
        Route::get('orders/{workOrder}/downtimes', [MachineDowntimeController::class, 'index'])->middleware('can:production.record');
        Route::post('orders/{workOrder}/downtimes', [MachineDowntimeController::class, 'store'])->middleware('can:production.execute');
    });

    Route::get('downtime/reasons', [MachineDowntimeController::class, 'reasons'])->middleware('can:production.record');
    Route::patch('machine-downtimes/{machineDowntime}', [MachineDowntimeController::class, 'update'])->middleware('can:production.execute');
    Route::post('machine-downtimes/{machineDowntime}/maintenance-request', [MachineDowntimeController::class, 'maintenanceRequest'])->middleware('can:maintenance.open_ticket');

    Route::get('quality/defects', [QualityInspectionController::class, 'defectsCatalog'])->middleware('can:quality.inspect');
    Route::get('quality-inspections/{qualityInspection}', [QualityInspectionController::class, 'show'])->middleware('can:quality.inspect');
    Route::match(['put', 'patch'], 'quality-inspections/{qualityInspection}', [QualityInspectionController::class, 'update'])->middleware('can:quality.inspect');
    Route::post('quality-inspections/{qualityInspection}/photos', [QualityInspectionController::class, 'storePhoto'])->middleware('can:quality.inspect');
    Route::post('quality-inspection-photos/{qualityInspectionPhoto}/replace', [QualityInspectionController::class, 'updatePhoto'])->middleware('can:quality.inspect');
    Route::post('quality-inspection-photos/{qualityInspectionPhoto}/delete', [QualityInspectionController::class, 'destroyPhoto'])->middleware('can:quality.inspect');
    Route::delete('quality-inspection-photos/{qualityInspectionPhoto}', [QualityInspectionController::class, 'destroyPhoto'])->middleware('can:quality.inspect');

    Route::get('products/{product}/quality-checklists', [QualityChecklistController::class, 'index'])->middleware('can:quality.inspect');
    Route::post('products/{product}/quality-checklists', [QualityChecklistController::class, 'store'])->middleware('can:quality.manage_checklists');
    Route::match(['put', 'patch'], 'quality-checklists/{qualityChecklist}', [QualityChecklistController::class, 'update'])->middleware('can:quality.manage_checklists');
    Route::delete('quality-checklists/{qualityChecklist}', [QualityChecklistController::class, 'destroy'])->middleware('can:quality.manage_checklists');
    Route::post('quality-checklists/{qualityChecklist}/items', [QualityChecklistController::class, 'storeItem'])->middleware('can:quality.manage_checklists');
    Route::patch('quality-checklist-items/{qualityChecklistItem}', [QualityChecklistController::class, 'updateItem'])->middleware('can:quality.manage_checklists');

    Route::get('maintenance/tickets', [MaintenanceController::class, 'index'])->middleware('can:maintenance.open_ticket');
    Route::post('maintenance/tickets', [MaintenanceController::class, 'store']);
});
