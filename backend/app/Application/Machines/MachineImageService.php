<?php

namespace App\Application\Machines;

use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MachineImageService
{
    public function store(Machine $machine, UploadedFile $file, bool $isPrimary = false): MachineImage
    {
        return DB::transaction(function () use ($machine, $file, $isPrimary): MachineImage {
            $path = $file->store('machines/'.$machine->id, 'public');
            $url = Storage::disk('public')->url($path);

            $shouldBePrimary = $isPrimary || ! MachineImage::query()->where('machine_id', $machine->id)->exists();

            if ($shouldBePrimary) {
                MachineImage::query()->where('machine_id', $machine->id)->update(['is_primary' => false]);
                $machine->update(['image_url' => $url]);
            }

            return MachineImage::query()->create([
                'machine_id' => $machine->id,
                'image_url' => $url,
                'is_primary' => $shouldBePrimary,
                'uploaded_at' => now(),
            ]);
        });
    }

    public function delete(MachineImage $image): void
    {
        DB::transaction(function () use ($image): void {
            $this->deleteStoredFile($image->image_url);

            $wasPrimary = $image->is_primary;
            $machineId = $image->machine_id;
            $image->delete();

            if ($wasPrimary) {
                $next = MachineImage::query()->where('machine_id', $machineId)->orderByDesc('uploaded_at')->first();
                if ($next) {
                    $next->update(['is_primary' => true]);
                    Machine::query()->whereKey($machineId)->update(['image_url' => $next->image_url]);
                } else {
                    Machine::query()->whereKey($machineId)->update(['image_url' => null]);
                }
            }
        });
    }

    public function setPrimary(MachineImage $image): MachineImage
    {
        return DB::transaction(function () use ($image): MachineImage {
            MachineImage::query()->where('machine_id', $image->machine_id)->update(['is_primary' => false]);
            $image->update(['is_primary' => true]);
            Machine::query()->whereKey($image->machine_id)->update(['image_url' => $image->image_url]);

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
