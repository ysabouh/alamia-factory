<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Domain\Factory\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * CRUD موظفين عبر Laravel Eloquent.
 */
class WorkforceEmployeesController
{
    /**
     * @return array<int|string, mixed>
     */
    private static function employeeRelations(): array
    {
        return [
            'hall:id,name,code',
            'organizationalDepartment:id,name,code',
            'jobRole:id,name,code,role_level',
            'shift:id,name,code,starts_at,ends_at',
            'employmentStatus:id,name,code',
            'user.roles' => fn ($q) => $q->where('guard_name', 'web'),
            'user.roles.permissions' => fn ($q) => $q->where('guard_name', 'web'),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));

        $q = Employee::query()->with(self::employeeRelations());

        if ($request->has('isActive')) {
            $q->where('is_active', $request->boolean('isActive'));
        }

        if ($request->filled('statusId')) {
            $q->where('employment_status_id', $request->query('statusId'));
        }

        if ($request->filled('departmentId')) {
            $q->where('department_id', $request->query('departmentId'));
        }

        if ($request->filled('shiftId')) {
            $q->where('shift_id', $request->query('shiftId'));
        }

        if ($request->filled('jobRoleId')) {
            $q->where('job_role_id', $request->query('jobRoleId'));
        }

        if ($request->filled('hallId')) {
            $q->where('hall_id', $request->query('hallId'));
        }

        if ($s = trim((string) $request->query('search', ''))) {
            $q->where(function ($w) use ($s): void {
                $w->where('employee_number', 'like', '%'.$s.'%')
                    ->orWhere('first_name', 'like', '%'.$s.'%')
                    ->orWhere('last_name', 'like', '%'.$s.'%')
                    ->orWhere('name', 'like', '%'.$s.'%')
                    ->orWhere('email', 'like', '%'.$s.'%');
            });
        }

        $sortBy = (string) $request->query('sortBy', 'createdAt');
        $order = strtolower((string) $request->query('sortOrder', 'desc')) === 'asc' ? 'asc' : 'desc';
        $column = match ($sortBy) {
            'employeeNumber' => 'employee_number',
            'firstName' => 'first_name',
            'lastName' => 'last_name',
            'hireDate' => 'hire_date',
            'basicSalary' => 'basic_salary',
            'performanceScore' => 'performance_score',
            default => 'created_at',
        };

        $q->orderBy($column, $order);

        $total = (clone $q)->count();
        $rows = $q->forPage($page, $pageSize)->get();

        return response()->json([
            'data' => $rows->map(fn (Employee $e) => $this->serializeEmployee($e))->values()->all(),
            'meta' => [
                'page' => $page,
                'pageSize' => $pageSize,
                'total' => $total,
                'totalPages' => max(1, (int) ceil($total / $pageSize)),
            ],
        ]);
    }

    public function show(Employee $employee): JsonResponse
    {
        $employee->load(self::employeeRelations());

        return response()->json($this->serializeEmployee($employee));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'employeeNumber' => 'sometimes|string|max:50',
            'employee_number' => 'sometimes|string|max:50',
            'firstName' => 'required_without:first_name|string|max:100',
            'first_name' => 'required_without:firstName|string|max:100',
            'lastName' => 'required_without:last_name|string|max:100',
            'last_name' => 'required_without:lastName|string|max:100',
            'hireDate' => 'required_without:hire_date|date',
            'hire_date' => 'required_without:hireDate|date',
        ]);

        $attrs = $this->mappedAttributes($request, true);
        $employee = new Employee;
        $employee->fill($attrs);
        $code = $attrs['employee_number'] ?? $attrs['code'] ?? null;
        $employee->code = $code !== null && $code !== '' ? (string) $code : 'EMP-'.substr((string) time(), -10);
        if ($employee->name === null || $employee->name === '') {
            $employee->name = trim((string) ($employee->first_name ?? '').' '.(string) ($employee->last_name ?? ''));
        }
        if ($employee->is_active === null) {
            $employee->is_active = true;
        }
        $employee->save();
        $employee->load(self::employeeRelations());

        return response()->json($this->serializeEmployee($employee), JsonResponse::HTTP_CREATED);
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $patch = $this->mappedAttributesForPatch($request);
        foreach ($patch as $key => $value) {
            $employee->{$key} = $value;
        }
        $employee->save();
        $employee->load(self::employeeRelations());

        return response()->json($this->serializeEmployee($employee));
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();

        return response()->json(['deleted' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mappedAttributes(Request $request, bool $isCreate): array
    {
        $in = $request->all();
        $g = static fn (string $camel, string $snake) => $in[$camel] ?? $in[$snake] ?? null;

        $employeeNumber = $g('employeeNumber', 'employee_number');
        $firstName = $g('firstName', 'first_name');
        $lastName = $g('lastName', 'last_name');

        $out = [
            'employee_number' => $employeeNumber !== null && $employeeNumber !== '' ? (string) $employeeNumber : null,
            'first_name' => $firstName !== null ? (string) $firstName : null,
            'last_name' => $lastName !== null ? (string) $lastName : null,
            'gender' => $g('gender', 'gender'),
            'birth_date' => $this->nullableDate($g('birthDate', 'birth_date')),
            'phone' => $g('phone', 'phone'),
            'emergency_phone' => $g('emergencyPhone', 'emergency_phone'),
            'email' => $g('email', 'email'),
            'national_id' => $g('nationalId', 'national_id'),
            'address' => $g('address', 'address'),
            'hire_date' => $this->nullableDate($g('hireDate', 'hire_date')),
            'hall_id' => $this->nullableFk($g('hallId', 'hall_id')),
            'department_id' => $this->nullableFk($g('departmentId', 'department_id')),
            'job_role_id' => $this->nullableFk($g('jobRoleId', 'job_role_id')),
            'shift_id' => $this->nullableFk($g('shiftId', 'shift_id')),
            'employment_status_id' => $this->nullableFk($g('statusId', 'status_id')),
            'basic_salary' => $this->nullableDecimal($g('basicSalary', 'basic_salary')),
            'overtime_hour_rate' => $this->nullableDecimal($g('overtimeHourRate', 'overtime_hour_rate')),
            'overtime_friday_hour_rate' => $this->nullableDecimal($g('overtimeFridayHourRate', 'overtime_friday_hour_rate')),
            'performance_score' => $this->nullableDecimal($g('performanceScore', 'performance_score')),
            'reliability_score' => $this->nullableDecimal($g('reliabilityScore', 'reliability_score')),
            'safety_score' => $this->nullableDecimal($g('safetyScore', 'safety_score')),
            'annual_leave_balance' => $this->nullableInt($g('annualLeaveBalance', 'annual_leave_balance')),
            'profile_image' => $g('profileImage', 'profile_image'),
            'notes' => $g('notes', 'notes'),
        ];

        if (array_key_exists('isActive', $in) || array_key_exists('is_active', $in)) {
            $out['is_active'] = $request->boolean('isActive', $request->boolean('is_active'));
        } elseif ($isCreate) {
            $out['is_active'] = true;
        }

        if ($isCreate) {
            $out['code'] = $out['employee_number'] ?: ('EMP-'.substr((string) time(), -10));
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    private function mappedAttributesForPatch(Request $request): array
    {
        $in = $request->all();
        $pairs = [
            'employeeNumber' => 'employee_number',
            'firstName' => 'first_name',
            'lastName' => 'last_name',
            'gender' => 'gender',
            'birthDate' => 'birth_date',
            'phone' => 'phone',
            'emergencyPhone' => 'emergency_phone',
            'email' => 'email',
            'nationalId' => 'national_id',
            'address' => 'address',
            'hireDate' => 'hire_date',
            'hallId' => 'hall_id',
            'departmentId' => 'department_id',
            'jobRoleId' => 'job_role_id',
            'shiftId' => 'shift_id',
            'statusId' => 'employment_status_id',
            'basicSalary' => 'basic_salary',
            'overtimeHourRate' => 'overtime_hour_rate',
            'overtimeFridayHourRate' => 'overtime_friday_hour_rate',
            'performanceScore' => 'performance_score',
            'reliabilityScore' => 'reliability_score',
            'safetyScore' => 'safety_score',
            'annualLeaveBalance' => 'annual_leave_balance',
            'profileImage' => 'profile_image',
            'notes' => 'notes',
        ];

        $out = [];
        foreach ($pairs as $camel => $snake) {
            if (! array_key_exists($camel, $in) && ! array_key_exists($snake, $in)) {
                continue;
            }
            $v = $in[$camel] ?? $in[$snake];
            if (str_ends_with($snake, '_id')) {
                $out[$snake] = $v === '' || $v === null ? null : (int) $v;
            } elseif (in_array($snake, ['birth_date', 'hire_date'], true)) {
                $out[$snake] = $this->nullableDate($v);
            } elseif (in_array($snake, ['basic_salary', 'overtime_hour_rate', 'overtime_friday_hour_rate', 'performance_score', 'reliability_score', 'safety_score'], true)) {
                $out[$snake] = $this->nullableDecimal($v);
            } elseif ($snake === 'annual_leave_balance') {
                $out[$snake] = $this->nullableInt($v);
            } else {
                $out[$snake] = $v;
            }
        }

        if (array_key_exists('isActive', $in) || array_key_exists('is_active', $in)) {
            $out['is_active'] = $request->boolean('isActive', $request->boolean('is_active'));
        }

        return $out;
    }

    private function nullableDate(mixed $v): ?string
    {
        if ($v === null || $v === '') {
            return null;
        }

        return Carbon::parse((string) $v)->toDateString();
    }

    private function nullableFk(mixed $v): ?int
    {
        if ($v === null || $v === '') {
            return null;
        }

        return (int) $v;
    }

    private function nullableDecimal(mixed $v): ?float
    {
        if ($v === null || $v === '') {
            return null;
        }

        return (float) $v;
    }

    private function nullableInt(mixed $v): ?int
    {
        if ($v === null || $v === '') {
            return null;
        }

        return (int) $v;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeEmployee(Employee $e): array
    {
        $first = (string) ($e->first_name ?? '');
        $last = (string) ($e->last_name ?? '');
        $full = trim($first.' '.$last) !== '' ? trim($first.' '.$last) : (string) $e->name;

        $shift = $e->shift;
        $startT = $shift?->starts_at;
        $endT = $shift?->ends_at;

        return [
            'id' => (string) $e->id,
            'employeeNumber' => (string) ($e->employee_number ?? $e->code),
            'firstName' => $first,
            'lastName' => $last,
            'fullName' => $full,
            'gender' => $e->gender,
            'birthDate' => $e->birth_date?->toDateString(),
            'hireDate' => $e->hire_date?->toDateString() ?? '',
            'phone' => $e->phone,
            'emergencyPhone' => $e->emergency_phone,
            'email' => $e->email,
            'nationalId' => $e->national_id,
            'address' => $e->address,
            'hallId' => $e->hall_id !== null ? (string) $e->hall_id : null,
            'departmentId' => $e->department_id !== null ? (string) $e->department_id : null,
            'jobRoleId' => $e->job_role_id !== null ? (string) $e->job_role_id : null,
            'shiftId' => $e->shift_id !== null ? (string) $e->shift_id : null,
            'employeeStatusId' => $e->employment_status_id !== null ? (string) $e->employment_status_id : null,
            'basicSalary' => (float) $e->basic_salary,
            'overtimeHourRate' => (float) $e->overtime_hour_rate,
            'overtimeFridayHourRate' => (float) ($e->overtime_friday_hour_rate ?? 0),
            'performanceScore' => (float) $e->performance_score,
            'reliabilityScore' => (float) $e->reliability_score,
            'safetyScore' => (float) $e->safety_score,
            'annualLeaveBalance' => (int) $e->annual_leave_balance,
            'profileImage' => $e->profile_image,
            'notes' => $e->notes,
            'isActive' => (bool) $e->is_active,
            'createdAt' => $e->created_at?->toIso8601String(),
            'updatedAt' => $e->updated_at?->toIso8601String(),
            'hall' => $e->hall ? [
                'id' => (string) $e->hall->id,
                'name' => $e->hall->name,
                'code' => $e->hall->code,
            ] : null,
            'department' => $e->organizationalDepartment ? [
                'id' => (string) $e->organizationalDepartment->id,
                'name' => $e->organizationalDepartment->name,
                'code' => $e->organizationalDepartment->code,
            ] : null,
            'jobRole' => $e->jobRole ? [
                'id' => (string) $e->jobRole->id,
                'name' => $e->jobRole->name,
                'code' => $e->jobRole->code,
                'roleLevel' => (int) $e->jobRole->role_level,
            ] : null,
            'shift' => $shift ? [
                'id' => (string) $shift->id,
                'name' => $shift->name,
                'code' => (string) ($shift->code ?? ''),
                'startTime' => $startT ? Carbon::parse($startT)->format('H:i') : '',
                'endTime' => $endT ? Carbon::parse($endT)->format('H:i') : '',
            ] : null,
            'status' => $e->employmentStatus ? [
                'id' => (string) $e->employmentStatus->id,
                'name' => $e->employmentStatus->name,
                'code' => $e->employmentStatus->code,
            ] : null,
            'systemUser' => $this->serializeLinkedUser($e),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function serializeLinkedUser(Employee $e): ?array
    {
        $user = $e->user;
        if (! $user) {
            return null;
        }

        return [
            'id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'isActive' => (bool) $user->is_active,
            'roles' => $user->roleNamesForApi(),
            'permissions' => $user->permissionNamesForApi(),
        ];
    }
}
