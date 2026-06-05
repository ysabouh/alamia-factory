<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Machines;

use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\MachineType;
use App\Interfaces\Http\Support\SerializesMachines;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MachineTypesController
{
    use SerializesMachines;

    public function __construct(
        private readonly MasterQuery $masterQuery,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = MachineType::query();
        if ($request->filled('search')) {
            $s = '%'.$request->query('search').'%';
            $q->where(function ($w) use ($s): void {
                $w->where('code', 'like', $s)->orWhere('name', 'like', $s);
            });
        }
        if ($request->filled('is_active')) {
            $q->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $total = (clone $q)->count();
        $meta = $this->masterQuery->paginateMeta($request, $total);
        $rows = $q->orderBy('code')->forPage($meta['page'], $meta['pageSize'])->get();

        return response()->json([
            'data' => $rows->map(fn (MachineType $t) => $this->serializeMachineType($t))->values(),
            'meta' => $meta,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40', 'unique:machine_types,code'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $type = MachineType::query()->create([
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['isActive'] ?? true,
        ]);

        return response()->json(['data' => $this->serializeMachineType($type)], 201);
    }

    public function update(Request $request, MachineType $machineType): JsonResponse
    {
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:40', 'unique:machine_types,code,'.$machineType->id],
            'name' => ['sometimes', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $machineType->fill([
            'code' => $data['code'] ?? $machineType->code,
            'name' => $data['name'] ?? $machineType->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $machineType->description,
            'is_active' => $data['isActive'] ?? $machineType->is_active,
        ])->save();

        return response()->json(['data' => $this->serializeMachineType($machineType->fresh())]);
    }
}
