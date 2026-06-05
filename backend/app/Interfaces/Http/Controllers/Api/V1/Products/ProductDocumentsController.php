<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Products;

use App\Application\Products\ProductDocumentService;
use App\Domain\Factory\Enums\ProductDocumentType;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\ProductDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductDocumentsController
{
    public function __construct(
        private readonly ProductDocumentService $documents,
    ) {}

    public function store(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:20480'],
            'documentName' => ['required', 'string', 'max:255'],
            'documentType' => ['nullable', 'string', 'in:'.implode(',', array_column(ProductDocumentType::cases(), 'value'))],
        ]);

        $doc = $this->documents->store(
            $product,
            $data['file'],
            $data['documentName'],
            $data['documentType'] ?? null
        );

        return response()->json(['data' => $this->serialize($doc)], 201);
    }

    public function destroy(ProductDocument $productDocument): JsonResponse
    {
        $this->documents->delete($productDocument);

        return response()->json(['deleted' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(ProductDocument $doc): array
    {
        return [
            'id' => (string) $doc->id,
            'productId' => (string) $doc->product_id,
            'documentName' => $doc->document_name,
            'documentType' => $doc->document_type?->value ?? $doc->document_type,
            'fileUrl' => $doc->file_url,
            'uploadedAt' => $doc->uploaded_at?->toIso8601String(),
        ];
    }
}
