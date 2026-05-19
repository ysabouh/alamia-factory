<?php

namespace App\Domain\Factory\Repositories;

use App\Domain\Factory\Models\AttendanceRecord;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AttendanceRecordRepository
{
    public function findForEmployeeDate(int $employeeId, CarbonInterface $date): ?AttendanceRecord
    {
        return AttendanceRecord::query()
            ->where('employee_id', $employeeId)
            ->whereDate('attendance_date', $date)
            ->first();
    }

    public function queryForDate(CarbonInterface $date, array $filters = []): Builder
    {
        $q = AttendanceRecord::query()
            ->with(['employee.shift', 'employee.organizationalDepartment'])
            ->whereDate('attendance_date', $date);

        if (! empty($filters['departmentId'])) {
            $q->whereHas('employee', fn ($e) => $e->where('department_id', $filters['departmentId']));
        }
        if (! empty($filters['shiftId'])) {
            $q->whereHas('employee', fn ($e) => $e->where('shift_id', $filters['shiftId']));
        }
        if (! empty($filters['search'])) {
            $s = '%'.$filters['search'].'%';
            $q->whereHas('employee', function ($e) use ($s): void {
                $e->where('first_name', 'like', $s)
                    ->orWhere('last_name', 'like', $s)
                    ->orWhere('employee_number', 'like', $s)
                    ->orWhere('name', 'like', $s);
            });
        }
        if (! empty($filters['status'])) {
            $q->where('attendance_status', $filters['status']);
        }

        return $q;
    }

    public function paginateForDate(CarbonInterface $date, array $filters, int $page, int $pageSize): LengthAwarePaginator
    {
        return $this->queryForDate($date, $filters)
            ->orderByDesc('updated_at')
            ->paginate(perPage: $pageSize, page: $page);
    }

    /**
     * @return Collection<int, AttendanceRecord>
     */
    public function forEmployeeBetween(int $employeeId, CarbonInterface $from, CarbonInterface $to): Collection
    {
        return AttendanceRecord::query()
            ->where('employee_id', $employeeId)
            ->whereBetween('attendance_date', [$from->toDateString(), $to->toDateString()])
            ->orderBy('attendance_date')
            ->get();
    }

    /**
     * @return Collection<int, AttendanceRecord>
     */
    public function forPeriod(CarbonInterface $from, CarbonInterface $to): Collection
    {
        return AttendanceRecord::query()
            ->whereBetween('attendance_date', [$from->toDateString(), $to->toDateString()])
            ->get();
    }
}
