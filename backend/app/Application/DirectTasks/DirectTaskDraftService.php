<?php

namespace App\Application\DirectTasks;

use App\Domain\Factory\Models\DirectTaskDraft;
use Illuminate\Support\Facades\Auth;

class DirectTaskDraftService
{
    public function getCurrent(): ?DirectTaskDraft
    {
        $userId = Auth::id();
        if ($userId === null) {
            return null;
        }

        return DirectTaskDraft::query()->where('user_id', $userId)->first();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function save(array $payload): DirectTaskDraft
    {
        $userId = Auth::id();
        if ($userId === null) {
            throw new \RuntimeException('Unauthenticated');
        }

        return DirectTaskDraft::query()->updateOrCreate(
            ['user_id' => $userId],
            ['payload' => $payload]
        );
    }

    public function clear(): void
    {
        $userId = Auth::id();
        if ($userId === null) {
            return;
        }

        DirectTaskDraft::query()->where('user_id', $userId)->delete();
    }
}
