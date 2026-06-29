<?php

namespace App\Application\Production;

use App\Domain\Factory\Models\MachineDowntime;
use App\Domain\Factory\Models\MachineDowntimePhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MachineDowntimePhotoService
{
    public function upload(MachineDowntime $downtime, UploadedFile $file): MachineDowntimePhoto
    {
        return DB::transaction(function () use ($downtime, $file): MachineDowntimePhoto {
            $path = $file->store('machine-downtimes/'.$downtime->id, 'public');

            return MachineDowntimePhoto::query()->create([
                'machine_downtime_id' => $downtime->id,
                'file_path' => '/storage/'.$path,
                'file_name' => $file->getClientOriginalName(),
                'uploaded_at' => now(),
            ]);
        });
    }

    public function replace(MachineDowntimePhoto $photo, UploadedFile $file): MachineDowntimePhoto
    {
        return DB::transaction(function () use ($photo, $file): MachineDowntimePhoto {
            $this->deleteStoredFile($photo);

            $path = $file->store('machine-downtimes/'.$photo->machine_downtime_id, 'public');

            $photo->update([
                'file_path' => '/storage/'.$path,
                'file_name' => $file->getClientOriginalName(),
                'uploaded_at' => now(),
            ]);

            return $photo->fresh();
        });
    }

    public function delete(MachineDowntimePhoto $photo): void
    {
        DB::transaction(function () use ($photo): void {
            $this->deleteStoredFile($photo);
            $photo->delete();
        });
    }

    private function deleteStoredFile(MachineDowntimePhoto $photo): void
    {
        $relative = Str::after((string) $photo->file_path, '/storage/');
        if ($relative !== (string) $photo->file_path) {
            Storage::disk('public')->delete($relative);
        }
    }
}
