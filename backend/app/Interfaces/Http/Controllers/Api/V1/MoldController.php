<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Molds\MoldMaintenanceService;
use App\Application\Molds\MoldService;
use App\Application\Molds\MoldStatisticsService;
use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\Mold;
use App\Interfaces\Http\Support\SerializesMolds;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class MoldController
{
    use SerializesMolds;

    public function __construct(
        private readonly MoldService $molds,
        private readonly MoldMaintenanceService $maintenance,
        private readonly MoldStatisticsService $statistics,
        private readonly MasterQuery $masterQuery,
    ) {}

    public function stats(): JsonResponse
    {
        return response()->json(['data' => $this->statistics->aggregate()]);
    }

    public function index(Request $request): JsonResponse
    {
        $meta = $this->masterQuery->paginateMeta($request, 0);
        $paginator = $this->molds->paginate($request->query(), $meta['page'], $meta['pageSize']);
        $meta['total'] = $paginator->total();
        $meta['totalPages'] = $paginator->lastPage();

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Mold $m) => $this->serializeMold($m))->values(),
            'meta' => $meta,
        ]);
    }

    public function byType(Request $request, string $type): JsonResponse
    {
        $meta = $this->masterQuery->paginateMeta($request, 0);
        $paginator = $this->molds->listByType($type, $request->query(), $meta['page'], $meta['pageSize']);
        $meta['total'] = $paginator->total();
        $meta['totalPages'] = $paginator->lastPage();

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Mold $m) => $this->serializeMold($m))->values(),
            'meta' => $meta,
        ]);
    }

    public function show(Mold $mold): JsonResponse
    {
        return response()->json([
            'data' => $this->serializeMold($this->molds->findDetail($mold->id), true),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $mold = $this->molds->create($this->validatedMold($request));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeMold($mold, true)], 201);
    }

    public function update(Request $request, Mold $mold): JsonResponse
    {
        try {
            $mold = $this->molds->update($mold, $this->validatedMold($request, false));
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $this->serializeMold($mold, true)]);
    }

    public function destroy(Mold $mold): JsonResponse
    {
        $this->molds->delete($mold);

        return response()->json(['deleted' => true]);
    }

    public function storeMaintenance(Request $request, Mold $mold): JsonResponse
    {
        $data = $request->validate([
            'maintenanceType' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string'],
            'technician' => ['nullable', 'string', 'max:120'],
            'maintenanceDate' => ['required', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'nextMaintenanceDate' => ['nullable', 'date'],
        ]);

        $log = $this->maintenance->log($mold, [
            'maintenance_type' => $data['maintenanceType'],
            'description' => $data['description'] ?? null,
            'technician' => $data['technician'] ?? null,
            'maintenance_date' => $data['maintenanceDate'],
            'cost' => $data['cost'] ?? null,
            'next_maintenance_date' => $data['nextMaintenanceDate'] ?? null,
        ]);

        return response()->json(['data' => $this->serializeMaintenanceLog($log)], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedMold(Request $request, bool $requireAll = true): array
    {
        $rules = [
            'productId' => [$requireAll ? 'required' : 'sometimes', 'integer', 'exists:products,id'],
            'moldCode' => [$requireAll ? 'required' : 'sometimes', 'string', 'max:40'],
            'moldName' => [$requireAll ? 'required' : 'sometimes', 'string', 'max:120'],
            'moldType' => [$requireAll ? 'required' : 'sometimes', 'in:injection,pet_blow,compression,polyethylene'],
            'status' => ['sometimes', 'in:active,maintenance,inactive'],
            'cavityCount' => ['sometimes', 'integer', 'min:1'],
            'productName' => ['nullable', 'string', 'max:120'],
            'materialType' => ['nullable', 'string', 'max:80'],
            'machineId' => ['nullable', 'integer', 'exists:machines,id'],
            'manufacturer' => ['nullable', 'string', 'max:120'],
            'manufacturingCountry' => ['nullable', 'string', 'max:80'],
            'manufacturingDate' => ['nullable', 'date'],
            'purchaseDate' => ['nullable', 'date'],
            'purchaseCost' => ['nullable', 'numeric', 'min:0'],
            'moldWeight' => ['nullable', 'numeric', 'min:0'],
            'moldDimensions' => ['nullable', 'string', 'max:120'],
            'expectedLifeCycles' => ['nullable', 'integer', 'min:0'],
            'totalCycles' => ['nullable', 'integer', 'min:0'],
            'currentLocation' => ['nullable', 'string', 'max:120'],
            'maintenanceCycle' => ['nullable', 'integer', 'min:0'],
            'lastMaintenanceDate' => ['nullable', 'date'],
            'nextMaintenanceDate' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'isActive' => ['sometimes', 'boolean'],
            'spec' => ['nullable', 'array'],
        ];

        $data = $request->validate($rules);

        return [
            'product_id' => $data['productId'] ?? null,
            'code' => $data['moldCode'] ?? null,
            'name' => $data['moldName'] ?? null,
            'mold_type' => $data['moldType'] ?? null,
            'status' => $data['status'] ?? 'active',
            'cavity_count' => $data['cavityCount'] ?? 1,
            'product_name' => $data['productName'] ?? null,
            'material_type' => $data['materialType'] ?? null,
            'machine_id' => $data['machineId'] ?? null,
            'manufacturer' => $data['manufacturer'] ?? null,
            'manufacturing_country' => $data['manufacturingCountry'] ?? null,
            'manufacturing_date' => $data['manufacturingDate'] ?? null,
            'purchase_date' => $data['purchaseDate'] ?? null,
            'purchase_cost' => $data['purchaseCost'] ?? null,
            'mold_weight' => $data['moldWeight'] ?? null,
            'mold_dimensions' => $data['moldDimensions'] ?? null,
            'expected_life_cycles' => $data['expectedLifeCycles'] ?? null,
            'total_cycles' => $data['totalCycles'] ?? null,
            'current_location' => $data['currentLocation'] ?? null,
            'maintenance_cycle' => $data['maintenanceCycle'] ?? null,
            'last_maintenance_date' => $data['lastMaintenanceDate'] ?? null,
            'next_maintenance_date' => $data['nextMaintenanceDate'] ?? null,
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['isActive'] ?? true,
            'spec' => $data['spec'] ?? null,
        ];
    }
}
