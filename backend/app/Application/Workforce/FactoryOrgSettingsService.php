<?php

namespace App\Application\Workforce;

use App\Domain\Factory\Models\Department;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\FactoryOrgSetting;

class FactoryOrgSettingsService
{
    /**
     * @return array{title: string, generalManagerEmployeeId: string|null}
     */
    public function get(): array
    {
        $row = $this->row();

        return [
            'title' => $row->title,
            'generalManagerEmployeeId' => $row->general_manager_employee_id
                ? (string) $row->general_manager_employee_id
                : null,
        ];
    }

    /**
     * @param  array{title?: string, generalManagerEmployeeId?: string|int|null}  $data
     * @return array{title: string, generalManagerEmployeeId: string|null}
     */
    public function update(array $data): array
    {
        $row = $this->row();

        if (array_key_exists('title', $data)) {
            $row->title = (string) $data['title'];
        }

        if (array_key_exists('generalManagerEmployeeId', $data)) {
            $gmId = $data['generalManagerEmployeeId'];
            if ($gmId === null || $gmId === '') {
                $row->general_manager_employee_id = null;
            } else {
                Employee::query()->findOrFail((int) $gmId);
                $row->general_manager_employee_id = (int) $gmId;
            }
        }

        $row->save();

        return $this->get();
    }

    public function row(): FactoryOrgSetting
    {
        return FactoryOrgSetting::query()->firstOrCreate(
            ['scope' => 'factory'],
            ['title' => 'المصنع']
        );
    }
}
