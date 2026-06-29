<?php

namespace App\Application\Workforce;

use App\Domain\Factory\Models\OrgChartLayoutSetting;

class OrgChartLayoutSettingsService
{
    private const SCOPE = 'factory';

    /**
     * @return array{settings: array<string, mixed>, positions: array<string, array{x: float, y: float}>}
     */
    public function get(): array
    {
        $row = $this->row();

        return [
            'settings' => $this->normalizeSettings($row->settings ?? []),
            'positions' => $this->normalizePositions($row->positions ?? []),
        ];
    }

    /**
     * @param  array<string, mixed>  $settings
     * @return array{settings: array<string, mixed>, positions: array<string, array{x: float, y: float}>}
     */
    public function updateSettings(array $settings): array
    {
        $row = $this->row();
        $merged = array_merge($this->normalizeSettings($row->settings ?? []), $this->filterSettings($settings));
        $row->settings = $merged;
        $row->save();

        return $this->get();
    }

    /**
     * @param  array<string, array{x?: float|int, y?: float|int}>  $positions
     * @return array{settings: array<string, mixed>, positions: array<string, array{x: float, y: float}>}
     */
    public function mergePositions(array $positions): array
    {
        $row = $this->row();
        $current = $this->normalizePositions($row->positions ?? []);

        foreach ($positions as $nodeId => $pos) {
            if (! is_string($nodeId) || ! is_array($pos)) {
                continue;
            }
            if (! isset($pos['x'], $pos['y'])) {
                continue;
            }
            $current[$nodeId] = [
                'x' => (float) $pos['x'],
                'y' => (float) $pos['y'],
            ];
        }

        $row->positions = $current;
        $row->save();

        return $this->get();
    }

    /**
     * @return array{settings: array<string, mixed>, positions: array<string, array{x: float, y: float}>}
     */
    public function resetPositions(): array
    {
        $row = $this->row();
        $row->positions = [];
        $row->save();

        return $this->get();
    }

    private function row(): OrgChartLayoutSetting
    {
        return OrgChartLayoutSetting::query()->firstOrCreate(
            ['scope' => self::SCOPE],
            [
                'settings' => $this->defaultSettings(),
                'positions' => [],
            ]
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultSettings(): array
    {
        return [
            'layoutMode' => 'auto',
            'direction' => 'TB',
            'nodeSep' => 40,
            'rankSep' => 70,
            'edgeType' => 'smoothstep',
            'reparentOnDrag' => false,
            'departmentColors' => [],
        ];
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>
     */
    private function normalizeSettings(array $raw): array
    {
        $defaults = $this->defaultSettings();
        $out = array_merge($defaults, $raw);

        $out['layoutMode'] = in_array($out['layoutMode'] ?? '', ['auto', 'manual'], true) ? $out['layoutMode'] : 'auto';
        $out['direction'] = in_array($out['direction'] ?? '', ['TB', 'LR'], true) ? $out['direction'] : 'TB';
        $out['nodeSep'] = max(10, min(200, (int) ($out['nodeSep'] ?? 40)));
        $out['rankSep'] = max(20, min(300, (int) ($out['rankSep'] ?? 70)));
        $out['edgeType'] = in_array($out['edgeType'] ?? '', ['smoothstep', 'step', 'straight'], true)
            ? $out['edgeType'] : 'smoothstep';
        $out['reparentOnDrag'] = (bool) ($out['reparentOnDrag'] ?? false);
        $out['departmentColors'] = is_array($out['departmentColors'] ?? null) ? $out['departmentColors'] : [];

        return $out;
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>
     */
    private function filterSettings(array $raw): array
    {
        $allowed = ['layoutMode', 'direction', 'nodeSep', 'rankSep', 'edgeType', 'reparentOnDrag', 'departmentColors'];
        $out = [];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $raw)) {
                $out[$key] = $raw[$key];
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, array{x: float, y: float}>
     */
    private function normalizePositions(array $raw): array
    {
        $out = [];
        foreach ($raw as $nodeId => $pos) {
            if (! is_string($nodeId) || ! is_array($pos)) {
                continue;
            }
            if (! isset($pos['x'], $pos['y'])) {
                continue;
            }
            $out[$nodeId] = ['x' => (float) $pos['x'], 'y' => (float) $pos['y']];
        }

        return $out;
    }
}
