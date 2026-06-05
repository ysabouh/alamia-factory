<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Application\Machines\MachineService;
use App\Application\Machines\UpdateMachineStatus;
use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\Machine;
use App\Interfaces\Http\Requests\UpdateMachineStatusRequest;
use App\Interfaces\Http\Support\SerializesMachines;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MachineController
{
    use SerializesMachines;

    public function __construct(
        private readonly MachineService $machines,
        private readonly MasterQuery $masterQuery,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $meta = $this->masterQuery->paginateMeta($request, 0);
        $page = $meta['page'];
        $pageSize = $meta['pageSize'];

        $paginator = $this->machines->paginate($request->query(), $page, $pageSize);
        $meta['total'] = $paginator->total();
        $meta['totalPages'] = $paginator->lastPage();

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Machine $m) => $this->serializeMachine($m))->values(),
            'meta' => $meta,
        ]);
    }

    public function show(Machine $machine): JsonResponse
    {
        return response()->json([
            'data' => $this->serializeMachine($this->machines->findDetail($machine->id), true),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedMachine($request);
        $machine = $this->machines->create($data);

        return response()->json(['data' => $this->serializeMachine($machine, true)], 201);
    }

    public function update(Request $request, Machine $machine): JsonResponse
    {
        $data = $this->validatedMachine($request, false);
        $machine = $this->machines->update($machine, $data);

        return response()->json(['data' => $this->serializeMachine($machine, true)]);
    }

    public function destroy(Machine $machine): JsonResponse
    {
        $this->machines->delete($machine);

        return response()->json(['deleted' => true]);
    }

    public function updateStatus(
        UpdateMachineStatusRequest $request,
        Machine $machine,
        UpdateMachineStatus $updateStatus
    ): JsonResponse {
        $machine = $updateStatus->handle($machine, $request->validated())->load(['type', 'injectionSpec', 'blowSpec']);

        return response()->json(['data' => $this->serializeMachine($machine)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedMachine(Request $request, bool $requireAll = true): array
    {
        $rules = [
            'machineTypeId' => [$requireAll ? 'required' : 'sometimes', 'integer', 'exists:machine_types,id'],
            'code' => [$requireAll ? 'required' : 'sometimes', 'string', 'max:40'],
            'name' => [$requireAll ? 'required' : 'sometimes', 'string', 'max:120'],
            'brand' => ['nullable', 'string', 'max:80'],
            'model' => ['nullable', 'string', 'max:80'],
            'serialNumber' => ['nullable', 'string', 'max:80'],
            'factorySection' => ['nullable', 'string', 'max:120'],
            'productionLine' => ['nullable', 'string', 'max:120'],
            'powerKw' => ['nullable', 'numeric', 'min:0'],
            'hourlyEnergyConsumption' => ['nullable', 'numeric', 'min:0'],
            'installationDate' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'isActive' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'in:running,stopped,maintenance,breakdown'],
            'spec' => ['nullable', 'array'],
        ];

        $data = $request->validate($rules);

        return [
            'machine_type_id' => $data['machineTypeId'] ?? null,
            'code' => $data['code'] ?? null,
            'name' => $data['name'] ?? null,
            'brand' => $data['brand'] ?? null,
            'model' => $data['model'] ?? null,
            'serial_number' => $data['serialNumber'] ?? null,
            'factory_section' => $data['factorySection'] ?? null,
            'production_line' => $data['productionLine'] ?? null,
            'power_kw' => $data['powerKw'] ?? null,
            'hourly_energy_consumption' => $data['hourlyEnergyConsumption'] ?? null,
            'installation_date' => $data['installationDate'] ?? null,
            'notes' => $data['notes'] ?? null,
            'is_active' => $data['isActive'] ?? true,
            'status' => $data['status'] ?? null,
            'spec' => $data['spec'] ?? null,
        ];
    }
}
