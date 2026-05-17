<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Users\LinkUserToEmployee;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UsersController
{
    public function __construct(
        private readonly LinkUserToEmployee $linkUserToEmployee
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));

        $q = User::query()->with(['employee:id,employee_number,first_name,last_name,name,email']);

        if ($s = trim((string) $request->query('search', ''))) {
            $q->where(function ($w) use ($s): void {
                $w->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%");
            });
        }

        if ($request->filled('employeeId')) {
            $q->where('employee_id', $request->query('employeeId'));
        }

        if ($request->boolean('unlinkedOnly')) {
            $q->whereNull('employee_id');
        }

        $total = (clone $q)->count();
        $rows = $q->orderBy('name')->forPage($page, $pageSize)->get();

        return response()->json([
            'data' => $rows->map(fn (User $u) => $this->serializeUser($u))->values()->all(),
            'meta' => [
                'page' => $page,
                'pageSize' => $pageSize,
                'total' => $total,
                'totalPages' => max(1, (int) ceil($total / $pageSize)),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['employee:id,employee_number,first_name,last_name,name,email']);

        return response()->json($this->serializeUser($user));
    }

    public function permissionsCatalog(): JsonResponse
    {
        $permissions = Permission::query()->where('guard_name', 'web')->orderBy('name')->pluck('name')->all();
        $roles = Role::query()->where('guard_name', 'web')->orderBy('name')->with('permissions:id,name')->get()->map(fn (Role $r) => [
            'name' => $r->name,
            'permissions' => $r->permissions->pluck('name')->values()->all(),
        ])->values()->all();

        return response()->json([
            'permissions' => $permissions,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'email' => ['sometimes', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->id)],
            'isActive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'employeeId' => ['nullable', 'integer', 'exists:employees,id'],
            'employee_id' => ['nullable', 'integer', 'exists:employees,id'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', Rule::exists('roles', 'name')->where('guard_name', 'web')],
            'password' => ['sometimes', 'string', 'min:8'],
            'unlinkEmployee' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }
        if (array_key_exists('password', $data)) {
            $user->password = $data['password'];
        }
        if (array_key_exists('isActive', $data) || array_key_exists('is_active', $data)) {
            $user->is_active = $request->boolean('isActive', $request->boolean('is_active'));
        }

        if ($request->boolean('unlinkEmployee')) {
            $user->employee_id = null;
        } elseif ($request->has('employeeId') || $request->has('employee_id')) {
            $raw = $request->input('employeeId', $request->input('employee_id'));
            if ($raw === null || $raw === '') {
                $user->employee_id = null;
            } else {
                $employeeId = (int) $raw;
                $this->linkUserToEmployee->assertEmployeeAvailable($employeeId, $user->id);
                $this->linkUserToEmployee->assertUserNotLinkedElsewhere($user, $employeeId);
                $user->employee_id = $employeeId;
            }
        }

        $user->save();

        if (array_key_exists('roles', $data)) {
            $user->syncRoles($data['roles']);
        }

        $user->load(['employee:id,employee_number,first_name,last_name,name,email']);

        return response()->json([
            'message' => __('factory.account_updated_success'),
            'user' => $this->serializeUser($user),
        ]);
    }

    /** إنشاء مستخدم جديد وربطه بالموظف */
    public function linkEmployee(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employeeId' => ['required', 'integer', 'exists:employees,id'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', Rule::exists('roles', 'name')->where('guard_name', 'web')],
        ]);

        $employee = $this->linkUserToEmployee->assertEmployeeAvailable((int) $data['employeeId']);

        $user = User::create([
            'employee_id' => $employee->id,
            'name' => $employee->full_name,
            'email' => $data['email'],
            'password' => $data['password'],
            'is_active' => true,
        ]);

        $user->syncRoles($data['roles'] ?? ['supervisor']);

        $user->load(['employee:id,employee_number,first_name,last_name,name,email']);

        return response()->json([
            'message' => __('factory.user_linked_success'),
            'user' => $this->serializeUser($user),
        ], JsonResponse::HTTP_CREATED);
    }

    /** ربط مستخدم موجود (بدون موظف) بموظف */
    public function linkExistingUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employeeId' => ['required', 'integer', 'exists:employees,id'],
            'userId' => ['required', 'integer', 'exists:users,id'],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', Rule::exists('roles', 'name')->where('guard_name', 'web')],
        ]);

        /** @var User $user */
        $user = User::query()->findOrFail($data['userId']);
        $employeeId = (int) $data['employeeId'];

        $this->linkUserToEmployee->assertEmployeeAvailable($employeeId, $user->id);
        $this->linkUserToEmployee->assertUserNotLinkedElsewhere($user, $employeeId);

        $employee = Employee::query()->findOrFail($employeeId);
        $user->employee_id = $employee->id;
        if (! $user->name) {
            $user->name = $employee->full_name;
        }
        $user->save();

        if (array_key_exists('roles', $data)) {
            $user->syncRoles($data['roles']);
        }

        $user->load(['employee:id,employee_number,first_name,last_name,name,email']);

        return response()->json([
            'message' => __('factory.user_linked_success'),
            'user' => $this->serializeUser($user),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUser(User $user): array
    {
        $employee = $user->employee;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'isActive' => (bool) $user->is_active,
            'employeeId' => $user->employee_id,
            'roles' => $user->roleNamesForApi(),
            'permissions' => $user->permissionNamesForApi(),
            'employee' => $employee ? [
                'id' => (string) $employee->id,
                'employeeNumber' => (string) ($employee->employee_number ?? $employee->code),
                'fullName' => $employee->full_name,
                'email' => $employee->email,
            ] : null,
        ];
    }
}
