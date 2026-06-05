<?php

namespace App\Application\Molds;

use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\MoldImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MoldImageService
{
    public function store(Mold $mold, UploadedFile $file, ?string $imageType = null, bool $isPrimary = false): MoldImage
    {
        return DB::transaction(function () use ($mold, $file, $imageType, $isPrimary): MoldImage {
            $path = $file->store('molds/'.$mold->id, 'public');
            $url = Storage::disk('public')->url($path);

            if ($isPrimary) {
                MoldImage::query()->where('mold_id', $mold->id)->update(['is_primary' => false]);
                $mold->update(['image_url' => $url]);
            }

            return MoldImage::query()->create([
                'mold_id' => $mold->id,
                'image_url' => $url,
                'image_type' => $imageType,
                'is_primary' => $isPrimary,
                'uploaded_at' => now(),
            ]);
        });
    }

    public function delete(MoldImage $image): void
    {
        DB::transaction(function () use ($image): void {
            $this->deleteStoredFile($image->image_url);

            $wasPrimary = $image->is_primary;
            $moldId = $image->mold_id;
            $image->delete();

            if ($wasPrimary) {
                $next = MoldImage::query()->where('mold_id', $moldId)->orderByDesc('uploaded_at')->first();
                if ($next) {
                    $next->update(['is_primary' => true]);
                    Mold::query()->whereKey($moldId)->update(['image_url' => $next->image_url]);
                } else {
                    Mold::query()->whereKey($moldId)->update(['image_url' => null]);
                }
            }
        });
    }

    public function setPrimary(MoldImage $image): MoldImage
    {
        return DB::transaction(function () use ($image): MoldImage {
            MoldImage::query()->where('mold_id', $image->mold_id)->update(['is_primary' => false]);
            $image->update(['is_primary' => true]);
            Mold::query()->whereKey($image->mold_id)->update(['image_url' => $image->image_url]);

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
