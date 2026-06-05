<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Molds;

use App\Application\Molds\MoldImageService;
use App\Domain\Factory\Enums\MoldImageType;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\MoldImage;
use App\Interfaces\Http\Support\SerializesMolds;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MoldImagesController
{
    use SerializesMolds;

    public function __construct(
        private readonly MoldImageService $images,
    ) {}

    public function store(Request $request, Mold $mold): JsonResponse
    {
        $data = $request->validate([
            'image' => ['required', 'file', 'image', 'max:10240'],
            'imageType' => ['nullable', 'string', 'in:'.implode(',', array_column(MoldImageType::cases(), 'value'))],
            'isPrimary' => ['sometimes', 'boolean'],
        ]);

        $image = $this->images->store(
            $mold,
            $data['image'],
            $data['imageType'] ?? null,
            (bool) ($data['isPrimary'] ?? false)
        );

        return response()->json(['data' => $this->serializeMoldImage($image)], 201);
    }

    public function destroy(MoldImage $moldImage): JsonResponse
    {
        $this->images->delete($moldImage);

        return response()->json(['deleted' => true]);
    }

    public function setPrimary(MoldImage $moldImage): JsonResponse
    {
        $image = $this->images->setPrimary($moldImage);

        return response()->json(['data' => $this->serializeMoldImage($image)]);
    }
}
