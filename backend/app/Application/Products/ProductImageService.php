<?php

namespace App\Application\Products;

use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageService
{
    public function store(Product $product, UploadedFile $file, ?string $imageType = null, bool $isPrimary = false): ProductImage
    {
        return DB::transaction(function () use ($product, $file, $imageType, $isPrimary): ProductImage {
            $path = $file->store('products/'.$product->id, 'public');
            $url = Storage::disk('public')->url($path);

            if ($isPrimary) {
                ProductImage::query()->where('product_id', $product->id)->update(['is_primary' => false]);
                $product->update(['image_url' => $url]);
            }

            return ProductImage::query()->create([
                'product_id' => $product->id,
                'image_url' => $url,
                'image_type' => $imageType ?? 'main',
                'is_primary' => $isPrimary,
                'uploaded_at' => now(),
            ]);
        });
    }

    public function delete(ProductImage $image): void
    {
        DB::transaction(function () use ($image): void {
            $this->deleteStoredFile($image->image_url);

            $wasPrimary = $image->is_primary;
            $productId = $image->product_id;
            $image->delete();

            if ($wasPrimary) {
                $next = ProductImage::query()->where('product_id', $productId)->orderByDesc('uploaded_at')->first();
                if ($next) {
                    $next->update(['is_primary' => true]);
                    Product::query()->whereKey($productId)->update(['image_url' => $next->image_url]);
                } else {
                    Product::query()->whereKey($productId)->update(['image_url' => null]);
                }
            }
        });
    }

    public function setPrimary(ProductImage $image): ProductImage
    {
        return DB::transaction(function () use ($image): ProductImage {
            ProductImage::query()->where('product_id', $image->product_id)->update(['is_primary' => false]);
            $image->update(['is_primary' => true]);
            Product::query()->whereKey($image->product_id)->update(['image_url' => $image->image_url]);

            return $image->fresh();
        });
    }

    private function deleteStoredFile(string $url): void
    {
        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path)) {
            return;
        }

        $relative = Str::after($path, '/storage/');
        if ($relative !== $path) {
            Storage::disk('public')->delete($relative);
        }
    }
}
