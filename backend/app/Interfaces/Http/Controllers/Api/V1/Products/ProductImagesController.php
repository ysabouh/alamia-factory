<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Products;

use App\Application\Products\ProductImageService;
use App\Domain\Factory\Enums\ProductImageType;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductImagesController
{
    public function __construct(
        private readonly ProductImageService $images,
    ) {}

    public function store(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'image' => ['required', 'file', 'image', 'max:10240'],
            'imageType' => ['nullable', 'string', 'in:'.implode(',', array_column(ProductImageType::cases(), 'value'))],
            'isPrimary' => ['sometimes', 'boolean'],
        ]);

        $image = $this->images->store(
            $product,
            $data['image'],
            $data['imageType'] ?? null,
            (bool) ($data['isPrimary'] ?? false)
        );

        return response()->json(['data' => $this->serialize($image)], 201);
    }

    public function destroy(ProductImage $productImage): JsonResponse
    {
        $this->images->delete($productImage);

        return response()->json(['deleted' => true]);
    }

    public function setPrimary(ProductImage $productImage): JsonResponse
    {
        $image = $this->images->setPrimary($productImage);

        return response()->json(['data' => $this->serialize($image)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(ProductImage $image): array
    {
        return [
            'id' => (string) $image->id,
            'productId' => (string) $image->product_id,
            'imageUrl' => $image->image_url,
            'imageType' => $image->image_type?->value ?? $image->image_type,
            'isPrimary' => (bool) $image->is_primary,
            'uploadedAt' => $image->uploaded_at?->toIso8601String(),
        ];
    }
}
