<?php

namespace App\Application\DirectTasks;

use App\Domain\Factory\Models\DirectTaskChecklistTemplate;
use Illuminate\Support\Collection;

class DirectTaskChecklistTemplateService
{
    /** @return Collection<int, DirectTaskChecklistTemplate> */
    public function listActive(): Collection
    {
        return DirectTaskChecklistTemplate::query()
            ->where('is_active', true)
            ->with('items')
            ->orderBy('name')
            ->get();
    }

    public function find(int $id): DirectTaskChecklistTemplate
    {
        return DirectTaskChecklistTemplate::query()->with('items')->findOrFail($id);
    }
}
