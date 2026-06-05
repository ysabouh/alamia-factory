<?php

namespace App\Application\Products;

use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductDocumentService
{
    public function store(Product $product, UploadedFile $file, string $documentName, ?string $documentType = null): ProductDocument
    {
        return DB::transaction(function () use ($product, $file, $documentName, $documentType): ProductDocument {
            $path = $file->store('products/'.$product->id.'/documents', 'public');
            $url = Storage::disk('public')->url($path);

            return ProductDocument::query()->create([
                'product_id' => $product->id,
                'document_name' => $documentName,
                'document_type' => $documentType ?? 'other',
                'file_url' => $url,
                'uploaded_at' => now(),
            ]);
        });
    }

    public function delete(ProductDocument $document): void
    {
        DB::transaction(function () use ($document): void {
            $this->deleteStoredFile($document->file_url);
            $document->delete();
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
