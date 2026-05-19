<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Masters;

use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\Shift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class ShiftsMasterController
{
    public function __construct(
        private readonly MasterQuery $masterQuery
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = $this->masterQuery->apply($request, Shift::query());
        $total = (clone $q)->count();
        $meta = $this->masterQuery->paginateMeta($request, $total);
        $rows = $q->orderBy('code')->forPage($meta['page'], $meta['pageSize'])->get();

        return response()->json([
            'data' => $rows->map(fn (Shift $s) => $this->serialize($s))->values()->all(),
            'meta' => $meta,
        ]);
    }

    public function show(Shift $shift): JsonResponse
    {
        return response()->json($this->serialize($shift));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $shift = Shift::create($data);

        return response()->json([
            'message' => __('factory.master_created'),
            'data' => $this->serialize($shift),
        ], JsonResponse::HTTP_CREATED);
    }

    public function update(Request $request, Shift $shift): JsonResponse
    {
        $data = $this->validated($request, $shift->id);
        $shift->fill($data);
        $shift->save();

        return response()->json([
            'message' => __('factory.master_updated'),
            'data' => $this->serialize($shift),
        ]);
    }

    public function activate(Shift $shift): JsonResponse
    {
        $shift->is_active = true;
        $shift->save();

        return response()->json([
            'message' => __('factory.master_activated'),
            'data' => $this->serialize($shift),
        ]);
    }

    public function deactivate(Shift $shift): JsonResponse
    {
        $shift->is_active = false;
        $shift->save();

        return response()->json([
            'message' => __('factory.master_deactivated'),
            'data' => $this->serialize($shift),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50', Rule::unique('shifts', 'code')->ignore($ignoreId)],
            'startTime' => ['required', 'date_format:H:i'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'endTime' => ['required', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i'],
            'description' => ['nullable', 'string', 'max:5000'],
            'breakMinutes' => ['sometimes', 'integer', 'min:0', 'max:600'],
            'break_minutes' => ['sometimes', 'integer', 'min:0', 'max:600'],
            'overtimeMultiplier' => ['sometimes', 'numeric', 'min:1', 'max:5'],
            'overtime_multiplier' => ['sometimes', 'numeric', 'min:1', 'max:5'],
            'fridayMultiplier' => ['sometimes', 'numeric', 'min:1', 'max:5'],
            'friday_multiplier' => ['sometimes', 'numeric', 'min:1', 'max:5'],
            'isActive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $start = $data['startTime'] ?? $data['start_time'];
        $end = $data['endTime'] ?? $data['end_time'];

        return [
            'name' => $data['name'],
            'code' => strtoupper(trim($data['code'])),
            'starts_at' => Carbon::createFromFormat('H:i', $start)->format('H:i:s'),
            'ends_at' => Carbon::createFromFormat('H:i', $end)->format('H:i:s'),
            'description' => $data['description'] ?? null,
            'break_minutes' => (int) ($data['breakMinutes'] ?? $data['break_minutes'] ?? 0),
            'overtime_multiplier' => (float) ($data['overtimeMultiplier'] ?? $data['overtime_multiplier'] ?? 1.5),
            'friday_multiplier' => (float) ($data['fridayMultiplier'] ?? $data['friday_multiplier'] ?? 2.0),
            'is_active' => array_key_exists('isActive', $data) || array_key_exists('is_active', $data)
                ? $request->boolean('isActive', $request->boolean('is_active'))
                : true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Shift $shift): array
    {
        return [
            'id' => (string) $shift->id,
            'name' => $shift->name,
            'code' => (string) ($shift->code ?? ''),
            'startTime' => $shift->starts_at ? Carbon::parse($shift->starts_at)->format('H:i') : '',
            'endTime' => $shift->ends_at ? Carbon::parse($shift->ends_at)->format('H:i') : '',
            'description' => $shift->description,
            'breakMinutes' => (int) ($shift->break_minutes ?? 0),
            'overtimeMultiplier' => (float) ($shift->overtime_multiplier ?? 1.5),
            'fridayMultiplier' => (float) ($shift->friday_multiplier ?? 2.0),
            'isActive' => (bool) $shift->is_active,
            'createdAt' => $shift->created_at?->toIso8601String(),
            'updatedAt' => $shift->updated_at?->toIso8601String(),
        ];
    }
}
