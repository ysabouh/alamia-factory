<?php

namespace App\Application\Quality;

use App\Domain\Factory\Models\QualityInspection;
use App\Domain\Factory\Models\QualityInspectionPhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QualityInspectionPhotoService
{
    public function upload(QualityInspection $inspection, UploadedFile $file): QualityInspectionPhoto
    {
        return DB::transaction(function () use ($inspection, $file): QualityInspectionPhoto {
            $path = $file->store('quality-inspections/'.$inspection->id, 'public');

            return QualityInspectionPhoto::query()->create([
                'quality_inspection_id' => $inspection->id,
                'file_path' => '/storage/'.$path,
                'file_name' => $file->getClientOriginalName(),
                'uploaded_at' => now(),
            ]);
        });
    }

    public function replace(QualityInspectionPhoto $photo, UploadedFile $file): QualityInspectionPhoto
    {
        return DB::transaction(function () use ($photo, $file): QualityInspectionPhoto {
            $this->deleteStoredFile($photo);

            $path = $file->store('quality-inspections/'.$photo->quality_inspection_id, 'public');

            $photo->update([
                'file_path' => '/storage/'.$path,
                'file_name' => $file->getClientOriginalName(),
                'uploaded_at' => now(),
            ]);

            return $photo->fresh();
        });
    }

    public function delete(QualityInspectionPhoto $photo): void
    {
        DB::transaction(function () use ($photo): void {
            $this->deleteStoredFile($photo);
            $photo->delete();
        });
    }

    private function deleteStoredFile(QualityInspectionPhoto $photo): void
    {
        $relative = Str::after((string) $photo->file_path, '/storage/');
        if ($relative !== (string) $photo->file_path) {
            Storage::disk('public')->delete($relative);
        }
    }
}
