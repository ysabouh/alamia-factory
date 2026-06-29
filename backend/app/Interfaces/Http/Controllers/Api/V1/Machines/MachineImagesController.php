<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Machines;

use App\Application\Machines\MachineImageService;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineImage;
use App\Interfaces\Http\Support\SerializesMachines;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MachineImagesController
{
    use SerializesMachines;

    public function __construct(
        private readonly MachineImageService $images,
    ) {}

    public function store(Request $request, Machine $machine): JsonResponse
    {
        $data = $request->validate([
            'image' => ['required', 'file', 'image', 'max:10240'],
            'isPrimary' => ['sometimes', 'boolean'],
        ]);

        $image = $this->images->store(
            $machine,
            $data['image'],
            (bool) ($data['isPrimary'] ?? false)
        );

        return response()->json(['data' => $this->serializeMachineImage($image)], 201);
    }

    public function destroy(MachineImage $machineImage): JsonResponse
    {
        $this->images->delete($machineImage);

        return response()->json(['deleted' => true]);
    }

    public function setPrimary(MachineImage $machineImage): JsonResponse
    {
        $image = $this->images->setPrimary($machineImage);

        return response()->json(['data' => $this->serializeMachineImage($image)]);
    }
}
