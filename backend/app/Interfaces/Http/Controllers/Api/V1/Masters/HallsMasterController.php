<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Masters;

use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\Hall;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HallsMasterController
{
    public function __construct(
        private readonly MasterQuery $masterQuery
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = $this->masterQuery->apply($request, Hall::query());
        $total = (clone $q)->count();
        $meta = $this->masterQuery->paginateMeta($request, $total);
        $rows = $q->orderBy('code')->forPage($meta['page'], $meta['pageSize'])->get();

        return response()->json([
            'data' => $rows->map(fn (Hall $h) => $this->serialize($h))->values()->all(),
            'meta' => $meta,
        ]);
    }

    public function show(Hall $hall): JsonResponse
    {
        return response()->json($this->serialize($hall));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $hall = Hall::create($data);

        return response()->json([
            'message' => __('factory.master_created'),
            'data' => $this->serialize($hall),
        ], JsonResponse::HTTP_CREATED);
    }

    public function update(Request $request, Hall $hall): JsonResponse
    {
        $data = $this->validated($request, $hall->id);
        $hall->fill($data);
        $hall->save();

        return response()->json([
            'message' => __('factory.master_updated'),
            'data' => $this->serialize($hall),
        ]);
    }

    public function activate(Hall $hall): JsonResponse
    {
        $hall->is_active = true;
        $hall->save();

        return response()->json([
            'message' => __('factory.master_activated'),
            'data' => $this->serialize($hall),
        ]);
    }

    public function deactivate(Hall $hall): JsonResponse
    {
        $hall->is_active = false;
        $hall->save();

        return response()->json([
            'message' => __('factory.master_deactivated'),
            'data' => $this->serialize($hall),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', Rule::unique('halls', 'code')->ignore($ignoreId)],
            'hallType' => ['nullable', 'string', 'max:80'],
            'hall_type' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:5000'],
            'isActive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return [
            'name' => $data['name'],
            'code' => strtoupper(trim($data['code'])),
            'hall_type' => $data['hallType'] ?? $data['hall_type'] ?? null,
            'description' => $data['description'] ?? null,
            'is_active' => array_key_exists('isActive', $data) || array_key_exists('is_active', $data)
                ? $request->boolean('isActive', $request->boolean('is_active'))
                : true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Hall $hall): array
    {
        return [
            'id' => (string) $hall->id,
            'name' => $hall->name,
            'code' => $hall->code,
            'hallType' => $hall->hall_type,
            'description' => $hall->description,
            'isActive' => (bool) $hall->is_active,
            'createdAt' => $hall->created_at?->toIso8601String(),
            'updatedAt' => $hall->updated_at?->toIso8601String(),
        ];
    }
}
