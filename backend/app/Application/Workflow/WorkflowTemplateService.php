<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Enums\WorkflowCategory;
use App\Domain\Factory\Enums\WorkflowPriority;
use App\Domain\Factory\Enums\WorkflowTemplateVersionStatus;
use App\Domain\Factory\Models\WorkflowTemplate;
use App\Domain\Factory\Models\WorkflowTemplateVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkflowTemplateService
{
    public function __construct(
        private readonly WorkflowAuditLogger $audit,
    ) {}

    /**
     * @param  array{
     *   code:string,
     *   name:string,
     *   description?:?string,
     *   category?:string,
     *   departmentId?:?int,
     *   isActive?:bool,
     *   defaultPriority?:string
     * }  $data
     */
    public function create(array $data): WorkflowTemplate
    {
        if (WorkflowTemplate::query()->where('code', $data['code'])->exists()) {
            throw ValidationException::withMessages(['code' => ['رمز سير العمل مستخدم مسبقاً.']]);
        }

        return DB::transaction(function () use ($data): WorkflowTemplate {
            $template = WorkflowTemplate::query()->create([
                'code' => $data['code'],
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'category' => $data['category'] ?? WorkflowCategory::Custom->value,
                'department_id' => $data['departmentId'] ?? null,
                'is_active' => $data['isActive'] ?? true,
                'default_priority' => $data['defaultPriority'] ?? WorkflowPriority::Normal->value,
            ]);

            WorkflowTemplateVersion::query()->create([
                'template_id' => $template->id,
                'version' => 1,
                'status' => WorkflowTemplateVersionStatus::Draft,
                'definition_json' => ['nodes' => [], 'edges' => []],
            ]);

            $this->audit->log($template, 'created', null, $template->only(['code', 'name', 'category']));

            return $template->load(['versions', 'department']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(WorkflowTemplate $template, array $data): WorkflowTemplate
    {
        $old = $template->only(['name', 'description', 'category', 'department_id', 'is_active', 'default_priority']);

        if (isset($data['code']) && $data['code'] !== $template->code) {
            if (WorkflowTemplate::query()->where('code', $data['code'])->where('id', '!=', $template->id)->exists()) {
                throw ValidationException::withMessages(['code' => ['رمز سير العمل مستخدم مسبقاً.']]);
            }
        }

        $template->update([
            'code' => $data['code'] ?? $template->code,
            'name' => $data['name'] ?? $template->name,
            'description' => array_key_exists('description', $data) ? $data['description'] : $template->description,
            'category' => $data['category'] ?? $template->category,
            'department_id' => array_key_exists('departmentId', $data) ? $data['departmentId'] : $template->department_id,
            'is_active' => $data['isActive'] ?? $template->is_active,
            'default_priority' => $data['defaultPriority'] ?? $template->default_priority,
        ]);

        $this->audit->log($template, 'updated', $old, $template->fresh()->only(array_keys($old)));

        return $template->fresh(['publishedVersion.stages.checklistItems', 'versions', 'department']);
    }

    public function clone(WorkflowTemplate $template, string $newCode, string $newName): WorkflowTemplate
    {
        if (WorkflowTemplate::query()->where('code', $newCode)->exists()) {
            throw ValidationException::withMessages(['code' => ['رمز سير العمل مستخدم مسبقاً.']]);
        }

        return DB::transaction(function () use ($template, $newCode, $newName): WorkflowTemplate {
            $sourceVersion = $template->publishedVersion
                ?? $template->versions()->orderByDesc('version')->first();

            $clone = WorkflowTemplate::query()->create([
                'code' => $newCode,
                'name' => $newName,
                'description' => $template->description,
                'category' => $template->category,
                'department_id' => $template->department_id,
                'is_active' => true,
                'default_priority' => $template->default_priority,
            ]);

            $newVersion = WorkflowTemplateVersion::query()->create([
                'template_id' => $clone->id,
                'version' => 1,
                'status' => WorkflowTemplateVersionStatus::Draft,
                'definition_json' => $sourceVersion?->definition_json ?? ['nodes' => [], 'edges' => []],
            ]);

            if ($sourceVersion) {
                app(WorkflowDesignerService::class)->copyStages($sourceVersion, $newVersion);
            }

            $this->audit->log($clone, 'cloned', ['sourceId' => $template->id], ['code' => $newCode]);

            return $clone->load(['versions.stages.checklistItems', 'department']);
        });
    }

    public function archive(WorkflowTemplate $template): WorkflowTemplate
    {
        $template->update(['is_active' => false]);
        $template->versions()
            ->where('status', WorkflowTemplateVersionStatus::Draft)
            ->update(['status' => WorkflowTemplateVersionStatus::Archived]);

        $this->audit->log($template, 'archived');

        return $template->fresh();
    }

    public function createDraftVersion(WorkflowTemplate $template): WorkflowTemplateVersion
    {
        $latest = $template->versions()->orderByDesc('version')->first();
        $nextVersion = ($latest?->version ?? 0) + 1;

        return DB::transaction(function () use ($template, $latest, $nextVersion): WorkflowTemplateVersion {
            $version = WorkflowTemplateVersion::query()->create([
                'template_id' => $template->id,
                'version' => $nextVersion,
                'status' => WorkflowTemplateVersionStatus::Draft,
                'definition_json' => $latest?->definition_json ?? ['nodes' => [], 'edges' => []],
            ]);

            if ($latest) {
                app(WorkflowDesignerService::class)->copyStages($latest, $version);
            }

            return $version->load('stages.checklistItems');
        });
    }

    public function publishVersion(WorkflowTemplateVersion $version): WorkflowTemplateVersion
    {
        if ($version->status !== WorkflowTemplateVersionStatus::Draft) {
            throw ValidationException::withMessages(['version' => ['يمكن نشر مسودات فقط.']]);
        }

        $stages = $version->stages()->count();
        if ($stages === 0) {
            throw ValidationException::withMessages(['stages' => ['يجب تعريف مرحلة واحدة على الأقل.']]);
        }

        return DB::transaction(function () use ($version): WorkflowTemplateVersion {
            $version->update([
                'status' => WorkflowTemplateVersionStatus::Published,
                'published_at' => now(),
            ]);

            $version->template->update(['published_version_id' => $version->id]);

            $this->audit->log($version, 'published', null, ['version' => $version->version]);

            return $version->fresh(['stages.checklistItems', 'template']);
        });
    }
}
