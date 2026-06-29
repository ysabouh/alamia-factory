<?php

namespace App\Application\Workflow;

use App\Domain\Factory\Enums\WorkflowAssignmentType;
use App\Domain\Factory\Enums\WorkflowTransitionConditionType;
use App\Domain\Factory\Models\WorkflowStage;
use App\Domain\Factory\Models\WorkflowStageChecklistItem;
use App\Domain\Factory\Models\WorkflowStageTransition;
use App\Domain\Factory\Models\WorkflowTemplateVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkflowDesignerService
{
    public function __construct(
        private readonly WorkflowAuditLogger $audit,
    ) {}

    /**
     * @param  array{nodes: array<int, array<string, mixed>>, edges: array<int, array<string, mixed>>}  $graph
     */
    public function saveGraph(WorkflowTemplateVersion $version, array $graph): WorkflowTemplateVersion
    {
        if ($version->status->value !== 'draft') {
            throw ValidationException::withMessages(['version' => ['لا يمكن تعديل نسخة منشورة.']]);
        }

        $nodes = $graph['nodes'] ?? [];
        $edges = $graph['edges'] ?? [];

        $stageNodes = array_values(array_filter($nodes, fn (array $n): bool => ! $this->isGatewayNode($n)));

        if (count($stageNodes) === 0) {
            throw ValidationException::withMessages(['nodes' => ['أضف مرحلة واحدة على الأقل.']]);
        }

        return DB::transaction(function () use ($version, $graph, $nodes, $stageNodes, $edges): WorkflowTemplateVersion {
            $version->transitions()->delete();
            $version->stages()->each(function (WorkflowStage $stage): void {
                $stage->checklistItems()->delete();
                $stage->delete();
            });

            $nodeIdToStageId = [];
            $stageNumber = 1;

            foreach ($stageNodes as $node) {
                $data = $node['data'] ?? [];
                $stage = WorkflowStage::query()->create([
                    'template_version_id' => $version->id,
                    'stage_number' => $stageNumber++,
                    'name' => (string) ($data['name'] ?? $node['id'] ?? 'مرحلة'),
                    'description' => $data['description'] ?? null,
                    'estimated_duration_minutes' => $data['estimatedDurationMinutes'] ?? null,
                    'sla_duration_minutes' => $data['slaDurationMinutes'] ?? null,
                    'assignment_type' => $data['assignmentType'] ?? WorkflowAssignmentType::SingleEmployee->value,
                    'assignment_config' => $data['assignmentConfig'] ?? [],
                    'requires_approval' => (bool) ($data['requiresApproval'] ?? false),
                    'allow_rejection' => (bool) ($data['allowRejection'] ?? false),
                    'allow_return' => (bool) ($data['allowReturn'] ?? false),
                    'checklist_required' => (bool) ($data['checklistRequired'] ?? false),
                    'required_attachments' => $data['requiredAttachments'] ?? [],
                    'position_x' => $node['position']['x'] ?? null,
                    'position_y' => $node['position']['y'] ?? null,
                    'node_id' => (string) ($node['id'] ?? ''),
                ]);

                $nodeIdToStageId[(string) $node['id']] = $stage->id;

                foreach ($data['checklist'] ?? [] as $i => $item) {
                    WorkflowStageChecklistItem::query()->create([
                        'stage_id' => $stage->id,
                        'label' => is_array($item) ? ($item['label'] ?? 'بند') : (string) $item,
                        'sort_order' => $i,
                        'is_required' => is_array($item) ? ($item['isRequired'] ?? true) : true,
                    ]);
                }
            }

            $gatewaySources = $this->buildGatewaySources($edges);
            $sortOrder = 0;
            $transitions = [];

            foreach ($edges as $edge) {
                $sourceId = (string) ($edge['source'] ?? '');
                $targetId = (string) ($edge['target'] ?? '');
                $edgeData = $edge['data'] ?? [];
                $condition = $this->parseConditionType($edgeData['conditionType'] ?? null);
                $label = isset($edgeData['label']) ? (string) $edgeData['label'] : null;

                $sourceIsGateway = $this->nodeIsGateway($nodes, $sourceId);
                $targetIsGateway = $this->nodeIsGateway($nodes, $targetId);

                if ($sourceIsGateway && isset($nodeIdToStageId[$targetId])) {
                    $fromStageNodeId = $gatewaySources[$sourceId] ?? null;
                    if (! $fromStageNodeId || ! isset($nodeIdToStageId[$fromStageNodeId])) {
                        continue;
                    }
                    $transitions[] = [
                        'template_version_id' => $version->id,
                        'from_stage_id' => $nodeIdToStageId[$fromStageNodeId],
                        'to_stage_id' => $nodeIdToStageId[$targetId],
                        'from_gateway_node_id' => $sourceId,
                        'condition_type' => $condition->value,
                        'label' => $label,
                        'sort_order' => $sortOrder++,
                    ];
                    continue;
                }

                if (isset($nodeIdToStageId[$sourceId], $nodeIdToStageId[$targetId]) && ! $targetIsGateway) {
                    $transitions[] = [
                        'template_version_id' => $version->id,
                        'from_stage_id' => $nodeIdToStageId[$sourceId],
                        'to_stage_id' => $nodeIdToStageId[$targetId],
                        'from_gateway_node_id' => null,
                        'condition_type' => $condition->value,
                        'label' => $label,
                        'sort_order' => $sortOrder++,
                    ];
                }
            }

            foreach ($transitions as $row) {
                WorkflowStageTransition::query()->create($row);
            }

            $defaultNextByStage = [];
            foreach ($transitions as $row) {
                $fromId = $row['from_stage_id'];
                if ($row['condition_type'] === WorkflowTransitionConditionType::Default->value
                    && ! isset($defaultNextByStage[$fromId])) {
                    $defaultNextByStage[$fromId] = $row['to_stage_id'];
                }
            }

            foreach ($defaultNextByStage as $fromStageId => $toStageId) {
                WorkflowStage::query()
                    ->where('id', $fromStageId)
                    ->update(['next_stage_id' => $toStageId]);
            }

            $graph = app(WorkflowAssignmentLabelService::class)->enrichGraphWithAssigneeNames($graph);
            $version->update(['definition_json' => $graph]);
            $this->audit->log($version, 'designer_saved', null, [
                'nodeCount' => count($stageNodes),
                'transitionCount' => count($transitions),
            ]);

            return $version->fresh(['stages.checklistItems', 'stages.nextStage', 'transitions']);
        });
    }

    public function copyStages(WorkflowTemplateVersion $from, WorkflowTemplateVersion $to): void
    {
        $idMap = [];

        foreach ($from->stages as $stage) {
            $copy = WorkflowStage::query()->create([
                'template_version_id' => $to->id,
                'stage_number' => $stage->stage_number,
                'name' => $stage->name,
                'description' => $stage->description,
                'estimated_duration_minutes' => $stage->estimated_duration_minutes,
                'sla_duration_minutes' => $stage->sla_duration_minutes,
                'assignment_type' => $stage->assignment_type,
                'assignment_config' => $stage->assignment_config,
                'requires_approval' => $stage->requires_approval,
                'allow_rejection' => $stage->allow_rejection,
                'allow_return' => $stage->allow_return,
                'checklist_required' => $stage->checklist_required,
                'required_attachments' => $stage->required_attachments,
                'position_x' => $stage->position_x,
                'position_y' => $stage->position_y,
                'node_id' => $stage->node_id,
            ]);
            $idMap[$stage->id] = $copy->id;

            foreach ($stage->checklistItems as $item) {
                WorkflowStageChecklistItem::query()->create([
                    'stage_id' => $copy->id,
                    'label' => $item->label,
                    'sort_order' => $item->sort_order,
                    'is_required' => $item->is_required,
                ]);
            }
        }

        $from->loadMissing('transitions');
        foreach ($from->transitions as $transition) {
            if (! isset($idMap[$transition->from_stage_id ?? 0], $idMap[$transition->to_stage_id])) {
                continue;
            }
            WorkflowStageTransition::query()->create([
                'template_version_id' => $to->id,
                'from_stage_id' => $transition->from_stage_id ? $idMap[$transition->from_stage_id] : null,
                'to_stage_id' => $idMap[$transition->to_stage_id],
                'from_gateway_node_id' => $transition->from_gateway_node_id,
                'condition_type' => $transition->condition_type,
                'label' => $transition->label,
                'sort_order' => $transition->sort_order,
            ]);
        }

        foreach ($from->stages as $stage) {
            if ($stage->next_stage_id && isset($idMap[$stage->id], $idMap[$stage->next_stage_id])) {
                WorkflowStage::query()
                    ->where('id', $idMap[$stage->id])
                    ->update(['next_stage_id' => $idMap[$stage->next_stage_id]]);
            }
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $nodes
     */
    private function isGatewayNode(array $node): bool
    {
        return ($node['type'] ?? '') === 'workflowGateway';
    }

    /**
     * @param  array<int, array<string, mixed>>  $nodes
     */
    private function nodeIsGateway(array $nodes, string $nodeId): bool
    {
        foreach ($nodes as $node) {
            if ((string) ($node['id'] ?? '') === $nodeId) {
                return $this->isGatewayNode($node);
            }
        }

        return false;
    }

    /**
     * @param  array<int, array<string, mixed>>  $edges
     * @return array<string, string>
     */
    private function buildGatewaySources(array $edges): array
    {
        $map = [];
        foreach ($edges as $edge) {
            $source = (string) ($edge['source'] ?? '');
            $target = (string) ($edge['target'] ?? '');
            if ($source !== '' && $target !== '') {
                $map[$target] = $source;
            }
        }

        return $map;
    }

    private function parseConditionType(?string $value): WorkflowTransitionConditionType
    {
        return WorkflowTransitionConditionType::tryFrom((string) $value)
            ?? WorkflowTransitionConditionType::Default;
    }
}
