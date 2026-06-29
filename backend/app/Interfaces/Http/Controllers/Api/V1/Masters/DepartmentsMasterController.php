<?php



namespace App\Interfaces\Http\Controllers\Api\V1\Masters;



use App\Application\Workforce\DepartmentHierarchyService;

use App\Application\Workforce\Masters\MasterQuery;

use App\Domain\Factory\Models\Department;

use App\Domain\Factory\Models\Employee;

use Illuminate\Http\JsonResponse;

use Illuminate\Http\Request;

use Illuminate\Validation\Rule;

use InvalidArgumentException;



class DepartmentsMasterController

{

    public function __construct(

        private readonly MasterQuery $masterQuery,

        private readonly DepartmentHierarchyService $hierarchy,

    ) {}



    public function index(Request $request): JsonResponse

    {

        $q = $this->masterQuery->apply($request, Department::query()->with('hall:id,name,code', 'parent:id,name,code', 'manager:id,first_name,last_name,name,employee_number'));

        $total = (clone $q)->count();

        $meta = $this->masterQuery->paginateMeta($request, $total);

        $rows = $q->orderBy('code')->forPage($meta['page'], $meta['pageSize'])->get();



        return response()->json([

            'data' => $rows->map(fn (Department $d) => $this->serialize($d))->values()->all(),

            'meta' => $meta,

        ]);

    }



    public function tree(): JsonResponse

    {

        $departments = Department::query()

            ->with('manager:id,first_name,last_name,name,employee_number')

            ->where('is_active', true)

            ->orderBy('code')

            ->get();



        $branches = $this->hierarchy->buildTree($departments, null);



        return response()->json([

            'data' => array_map(fn (array $b) => $this->serializeTreeNode($b), $branches),

        ]);

    }



    public function show(Department $department): JsonResponse

    {

        $department->load('hall:id,name,code', 'manager:id,first_name,last_name,name,employee_number', 'parent:id,name,code');



        return response()->json($this->serialize($department));

    }



    public function store(Request $request): JsonResponse

    {

        try {
            $data = $this->validated($request);
            $department = Department::create($data);
            $this->syncManagerAssignment($department);
        } catch (InvalidArgumentException $e) {

            return response()->json(['message' => $e->getMessage()], 422);

        }



        $department->load('hall:id,name,code', 'manager:id,first_name,last_name,name,employee_number', 'parent:id,name,code');



        return response()->json([

            'message' => __('factory.master_created'),

            'data' => $this->serialize($department),

        ], JsonResponse::HTTP_CREATED);

    }



    public function update(Request $request, Department $department): JsonResponse

    {

        try {

            $data = $this->validated($request, $department->id);

            if (array_key_exists('parent_id', $data)) {

                $this->hierarchy->assertValidParent($department, $data['parent_id']);

            }

            $department->fill($data);

            $department->save();

            $this->syncManagerAssignment($department);
        } catch (InvalidArgumentException $e) {

            return response()->json(['message' => $e->getMessage()], 422);

        }



        $department->load('hall:id,name,code', 'manager:id,first_name,last_name,name,employee_number', 'parent:id,name,code');



        return response()->json([

            'message' => __('factory.master_updated'),

            'data' => $this->serialize($department),

        ]);

    }



    public function activate(Department $department): JsonResponse

    {

        $department->is_active = true;

        $department->save();

        $department->load('hall:id,name,code', 'manager:id,first_name,last_name,name,employee_number', 'parent:id,name,code');



        return response()->json([

            'message' => __('factory.master_activated'),

            'data' => $this->serialize($department),

        ]);

    }



    public function deactivate(Department $department): JsonResponse

    {

        if ($department->children()->where('is_active', true)->exists()) {

            return response()->json(['message' => __('factory.department_has_active_children')], 422);

        }

        if ($department->employees()->exists()) {

            return response()->json(['message' => __('factory.department_has_employees')], 422);

        }

        if ($department->orgPositions()->exists()) {

            return response()->json(['message' => __('factory.department_has_positions')], 422);

        }



        $department->is_active = false;

        $department->save();

        $department->load('hall:id,name,code', 'manager:id,first_name,last_name,name,employee_number', 'parent:id,name,code');



        return response()->json([

            'message' => __('factory.master_deactivated'),

            'data' => $this->serialize($department),

        ]);

    }



    /**

     * @return array<string, mixed>

     */

    private function validated(Request $request, ?int $ignoreId = null): array

    {

        $data = $request->validate([

            'name' => ['required', 'string', 'max:150'],

            'code' => ['required', 'string', 'max:50', Rule::unique('departments', 'code')->ignore($ignoreId)],

            'hallId' => ['required', 'integer', 'exists:halls,id'],

            'hall_id' => ['sometimes', 'integer', 'exists:halls,id'],

            'parentId' => ['nullable', 'integer', 'exists:departments,id'],

            'parent_id' => ['nullable', 'integer', 'exists:departments,id'],

            'description' => ['nullable', 'string', 'max:5000'],

            'vacancyCount' => ['sometimes', 'integer', 'min:0'],

            'vacancy_count' => ['sometimes', 'integer', 'min:0'],

            'managerId' => ['required', 'integer', 'exists:employees,id'],

            'manager_id' => ['sometimes', 'required', 'integer', 'exists:employees,id'],

            'isActive' => ['sometimes', 'boolean'],

            'is_active' => ['sometimes', 'boolean'],

        ]);



        $out = [

            'name' => $data['name'],

            'code' => strtoupper(trim($data['code'])),

            'hall_id' => (int) ($data['hallId'] ?? $data['hall_id']),

            'description' => $data['description'] ?? null,

            'is_active' => array_key_exists('isActive', $data) || array_key_exists('is_active', $data)

                ? $request->boolean('isActive', $request->boolean('is_active'))

                : true,

        ];



        if (array_key_exists('parentId', $data) || array_key_exists('parent_id', $data)) {

            $pid = $data['parentId'] ?? $data['parent_id'] ?? null;

            $out['parent_id'] = $pid === null || $pid === '' ? null : (int) $pid;

        } elseif ($ignoreId === null) {

            $out['parent_id'] = null;

        }



        if (array_key_exists('vacancyCount', $data) || array_key_exists('vacancy_count', $data)) {

            $out['vacancy_count'] = (int) ($data['vacancyCount'] ?? $data['vacancy_count'] ?? 0);

        } elseif ($ignoreId === null) {

            $out['vacancy_count'] = 0;

        }



        $mid = $data['managerId'] ?? $data['manager_id'] ?? null;

        if ($mid === null || $mid === '') {

            throw new InvalidArgumentException(__('factory.department_manager_required'));

        }

        $out['manager_id'] = (int) $mid;



        return $out;

    }



    private function syncManagerAssignment(Department $department): void

    {

        if ($department->manager_id === null) {

            return;

        }



        $manager = Employee::query()->find($department->manager_id);

        if ($manager === null) {

            return;

        }



        if ((int) $manager->department_id !== (int) $department->id) {

            $manager->department_id = $department->id;

            if (! $this->hierarchy->isLeaf($department)) {

                $manager->org_position_id = null;

            }

            $manager->save();

        }

    }



    /**

     * @return array<string, mixed>

     */

    private function serialize(Department $department): array

    {

        $hall = $department->hall;

        $parent = $department->parent;



        return [

            'id' => (string) $department->id,

            'name' => $department->name,

            'code' => $department->code,

            'hallId' => $department->hall_id !== null ? (string) $department->hall_id : null,

            'hallName' => $hall?->name,

            'hallCode' => $hall?->code,

            'parentId' => $department->parent_id ? (string) $department->parent_id : null,

            'parentName' => $parent?->name,

            'parentCode' => $parent?->code,

            'isLeaf' => $this->hierarchy->isLeaf($department),

            'description' => $department->description,

            'vacancyCount' => (int) ($department->vacancy_count ?? 0),

            'managerId' => $department->manager_id ? (string) $department->manager_id : null,

            'managerName' => $department->manager?->full_name,

            'isActive' => (bool) $department->is_active,

            'createdAt' => $department->created_at?->toIso8601String(),

            'updatedAt' => $department->updated_at?->toIso8601String(),

        ];

    }



    /**

     * @param  array{department: Department, children: list<mixed>}  $branch

     * @return array<string, mixed>

     */

    private function serializeTreeNode(array $branch): array

    {

        $serialized = $this->serialize($branch['department']);

        $serialized['children'] = array_map(fn (array $c) => $this->serializeTreeNode($c), $branch['children']);



        return $serialized;

    }

}

