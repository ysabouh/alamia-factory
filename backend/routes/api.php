<?php

use App\Interfaces\Http\Controllers\Api\V1\AuthController;
use App\Interfaces\Http\Controllers\Api\V1\DashboardController;
use App\Interfaces\Http\Controllers\Api\V1\MachineController;
use App\Interfaces\Http\Controllers\Api\V1\MaintenanceController;
use App\Interfaces\Http\Controllers\Api\V1\ProductionController;
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

    Route::get('machines', [MachineController::class, 'index'])->middleware('can:machines.view');
    Route::patch('machines/{machine}/status', [MachineController::class, 'updateStatus']);

    Route::post('production/assignments', [ProductionController::class, 'assign']);
    Route::post('production/entries', [ProductionController::class, 'storeEntry']);
    Route::post('production/waste', [ProductionController::class, 'storeWaste']);
    Route::get('production/reports/daily', [ProductionController::class, 'dailyReport'])->middleware('can:production.reports');

    Route::get('maintenance/tickets', [MaintenanceController::class, 'index'])->middleware('can:maintenance.open_ticket');
    Route::post('maintenance/tickets', [MaintenanceController::class, 'store']);
});
