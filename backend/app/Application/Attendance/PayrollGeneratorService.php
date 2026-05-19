<?php

namespace App\Application\Attendance;

use App\Domain\Factory\Models\AttendanceRecord;
use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\OvertimeRequest;
use App\Domain\Factory\Models\Payroll;
use App\Domain\Factory\Models\PayrollItem;
use App\Domain\Factory\Repositories\AttendanceRecordRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PayrollGeneratorService
{
    public function __construct(
        private readonly AttendanceRecordRepository $attendanceRecords,
    ) {}

    /**
     * @param  array<int, array{periodStart: string, periodEnd: string}>|null  $periods
     * @return array{year:int,month:int,periodStart:string,periodEnd:string,periods:array<int,array{periodStart:string,periodEnd:string}>,items:array<int,array<string,mixed>>,totals:array<string,float>}
     */
    public function preview(int $year, int $month, ?Carbon $periodStart = null, ?Carbon $periodEnd = null, ?array $periods = null): array
    {
        $resolvedPeriods = [];

        if ($periods !== null && $periods !== []) {
            $merged = collect();
            foreach ($periods as $period) {
                [$from, $to] = $this->resolvePeriod(
                    $year,
                    $month,
                    Carbon::parse($period['periodStart']),
                    Carbon::parse($period['periodEnd'])
                );
                $resolvedPeriods[] = [
                    'periodStart' => $from->toDateString(),
                    'periodEnd' => $to->toDateString(),
                ];
                $merged = $this->mergePreviewItems($merged, $this->buildItems($from, $to));
            }
            $items = $merged;
        } else {
            [$from, $to] = $this->resolvePeriod($year, $month, $periodStart, $periodEnd);
            $items = $this->buildItems($from, $to);
            $resolvedPeriods[] = [
                'periodStart' => $from->toDateString(),
                'periodEnd' => $to->toDateString(),
            ];
        }

        $first = $resolvedPeriods[0];
        $last = $resolvedPeriods[count($resolvedPeriods) - 1];

        return [
            'year' => $year,
            'month' => $month,
            'periodStart' => $first['periodStart'],
            'periodEnd' => $last['periodEnd'],
            'periods' => $resolvedPeriods,
            'hourlyRateMeta' => AttendanceDefaults::payrollHourlyRateMeta(),
            'items' => $items->values()->all(),
            'totals' => $this->sumTotals($items),
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $accumulated
     * @param  Collection<int, array<string, mixed>>  $incoming
     * @return Collection<int, array<string, mixed>>
     */
    private function mergePreviewItems(Collection $accumulated, Collection $incoming): Collection
    {
        $byId = $accumulated->keyBy('employeeId');

        foreach ($incoming as $row) {
            $id = $row['employeeId'];
            if (! $byId->has($id)) {
                $byId->put($id, $row);

                continue;
            }

            $prev = $byId->get($id);
            $prevDays = $prev['snapshot']['days'] ?? [];
            $rowDays = $row['snapshot']['days'] ?? [];

            $merged = [
                'employeeId' => $id,
                'employeeNumber' => $prev['employeeNumber'] ?: $row['employeeNumber'],
                'fullName' => $prev['fullName'] ?: $row['fullName'],
                'basicSalary' => $prev['basicSalary'],
                'hourlyRate' => $prev['hourlyRate'],
                'daysPresent' => $prev['daysPresent'] + $row['daysPresent'],
                'daysAbsent' => $prev['daysAbsent'] + $row['daysAbsent'],
                'daysPaidLeave' => $prev['daysPaidLeave'] + $row['daysPaidLeave'],
                'daysUnpaidLeave' => $prev['daysUnpaidLeave'] + $row['daysUnpaidLeave'],
                'basicWorkHours' => round((float) $prev['basicWorkHours'] + (float) $row['basicWorkHours'], 2),
                'weekdayOvertimeRawHours' => round(
                    (float) $prev['weekdayOvertimeRawHours'] + (float) $row['weekdayOvertimeRawHours'],
                    2
                ),
                'fridayOvertimeRawHours' => round(
                    (float) $prev['fridayOvertimeRawHours'] + (float) $row['fridayOvertimeRawHours'],
                    2
                ),
                'weekdayOvertimeWeightedHours' => round(
                    (float) $prev['weekdayOvertimeWeightedHours'] + (float) $row['weekdayOvertimeWeightedHours'],
                    2
                ),
                'fridayOvertimeWeightedHours' => round(
                    (float) $prev['fridayOvertimeWeightedHours'] + (float) $row['fridayOvertimeWeightedHours'],
                    2
                ),
                'proratedBasicSalary' => round((float) $prev['proratedBasicSalary'] + (float) $row['proratedBasicSalary'], 2),
                'lastRecordLeaveHint' => $row['lastRecordLeaveHint'] ?? $prev['lastRecordLeaveHint'],
                'regularPay' => round((float) $prev['regularPay'] + (float) $row['regularPay'], 2),
                'overtimePay' => round((float) $prev['overtimePay'] + (float) $row['overtimePay'], 2),
                'fridayOvertimePay' => round((float) $prev['fridayOvertimePay'] + (float) $row['fridayOvertimePay'], 2),
                'snapshot' => [
                    'days' => array_merge($prevDays, $rowDays),
                ],
            ];

            $byId->put($id, $this->applyPayrollFormula($merged));
        }

        return $byId->values();
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolvePeriod(int $year, int $month, ?Carbon $periodStart, ?Carbon $periodEnd): array
    {
        $monthStart = Carbon::create($year, $month, 1)->startOfMonth()->startOfDay();
        $monthEnd = $monthStart->copy()->endOfMonth()->endOfDay();

        $from = ($periodStart ?? $monthStart)->copy()->startOfDay();
        $to = ($periodEnd ?? $monthEnd)->copy()->endOfDay();

        if ($from->lt($monthStart)) {
            $from = $monthStart->copy();
        }
        if ($to->gt($monthEnd)) {
            $to = $monthEnd->copy();
        }
        if ($from->gt($to)) {
            $from = $monthStart->copy();
            $to = $monthEnd->copy();
        }

        return [$from, $to];
    }

    public function generate(int $year, int $month, ?int $generatedBy = null): Payroll
    {
        return DB::transaction(function () use ($year, $month, $generatedBy) {
            $from = Carbon::create($year, $month, 1)->startOfMonth();
            $to = $from->copy()->endOfMonth();
            $items = $this->buildItems($from, $to);
            $totals = $this->sumTotals($items);

            $payroll = Payroll::query()->updateOrCreate(
                ['year' => $year, 'month' => $month],
                [
                    'status' => 'draft',
                    'period_start' => $from->toDateString(),
                    'period_end' => $to->toDateString(),
                    'total_regular_pay' => $totals['regularPay'],
                    'total_overtime_pay' => $totals['overtimePay'],
                    'total_friday_overtime_pay' => $totals['fridayOvertimePay'],
                    'total_amount' => $totals['totalPay'],
                    'generated_by' => $generatedBy,
                    'generated_at' => now(),
                ]
            );

            foreach ($items as $row) {
                PayrollItem::query()->updateOrCreate(
                    ['payroll_id' => $payroll->id, 'employee_id' => $row['employeeId']],
                    [
                        'days_present' => $row['daysPresent'],
                        'days_absent' => $row['daysAbsent'],
                        'total_worked_minutes' => $row['totalWorkedMinutes'],
                        'total_overtime_minutes' => $row['totalOvertimeMinutes'],
                        'total_friday_overtime_minutes' => $row['totalFridayOvertimeMinutes'],
                        'regular_pay' => $row['regularPay'],
                        'overtime_pay' => $row['overtimePay'],
                        'friday_overtime_pay' => $row['fridayOvertimePay'],
                        'total_pay' => $row['totalPay'],
                        'snapshot_json' => $row['snapshot'],
                    ]
                );
            }

            return $payroll->load('items.employee');
        });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function buildItems(Carbon $from, Carbon $to): Collection
    {
        $records = $this->attendanceRecords->forPeriod($from, $to)->groupBy('employee_id');
        $employeeIds = $records->keys()->merge(
            OvertimeRequest::query()
                ->whereBetween('overtime_date', [$from, $to])
                ->where('status', 'approved')
                ->pluck('employee_id')
        )->unique();

        $employees = Employee::query()->whereIn('id', $employeeIds)->get()->keyBy('id');

        $weekdayMult = (float) config('factory.overtime.weekday_multiplier', 1.5);
        $fridayMult = (float) config('factory.overtime.friday_multiplier', 2.0);

        return $employeeIds->map(function ($employeeId) use ($records, $employees, $from, $to, $weekdayMult, $fridayMult) {
            $employee = $employees->get($employeeId);
            /** @var Collection<int, AttendanceRecord> $rows */
            $rows = $records->get($employeeId, collect());

            $regular = round((float) $rows->sum('regular_pay'), 2);
            $ot = round((float) $rows->sum('overtime_pay'), 2);
            $fot = round((float) $rows->sum('friday_overtime_pay'), 2);

            $weekdayOvertimeRawHours = round((float) $rows->sum('overtime_minutes') / 60, 2);
            $fridayOvertimeRawHours = round((float) $rows->sum('friday_overtime_minutes') / 60, 2);
            $weekdayOvertimeWeightedHours = round($weekdayOvertimeRawHours * $weekdayMult, 2);
            $fridayOvertimeWeightedHours = round($fridayOvertimeRawHours * $fridayMult, 2);

            $dailyWorkMinutes = AttendanceDefaults::defaultDailyWorkMinutes();
            $basicMinutes = (int) $rows->sum('worked_minutes');
            $basicMinutes += $rows->where('attendance_status', 'paid_leave')->count() * $dailyWorkMinutes;
            $basicWorkHours = round($basicMinutes / 60, 2);

            $basicSalary = round((float) ($employee?->basic_salary ?? 0), 2);
            $hourlyRate = AttendanceDefaults::hourlyRateFromMonthlySalary($basicSalary);
            $proratedBasic = AttendanceDefaults::proratedBasicSalaryForPeriod($basicSalary, $from, $to);

            return $this->applyPayrollFormula([
                'employeeId' => (int) $employeeId,
                'employeeNumber' => $employee?->employee_number ?? '',
                'fullName' => $employee?->full_name ?? '',
                'basicSalary' => $basicSalary,
                'hourlyRate' => $hourlyRate,
                'daysPresent' => $rows->whereIn('attendance_status', ['present', 'late', 'remote', 'mission'])->count(),
                'daysAbsent' => $rows->where('attendance_status', 'absent')->count(),
                'daysPaidLeave' => $rows->where('attendance_status', 'paid_leave')->count(),
                'daysUnpaidLeave' => $rows->whereIn('attendance_status', ['unpaid_leave', 'leave'])->count(),
                'basicWorkHours' => $basicWorkHours,
                'weekdayOvertimeRawHours' => $weekdayOvertimeRawHours,
                'fridayOvertimeRawHours' => $fridayOvertimeRawHours,
                'weekdayOvertimeWeightedHours' => $weekdayOvertimeWeightedHours,
                'fridayOvertimeWeightedHours' => $fridayOvertimeWeightedHours,
                'proratedBasicSalary' => $proratedBasic,
                'lastRecordLeaveHint' => $this->lastRecordLeaveHint($rows),
                'regularPay' => $regular,
                'overtimePay' => $ot,
                'fridayOvertimePay' => $fot,
                'snapshot' => [
                    'days' => $rows->map(fn (AttendanceRecord $r) => [
                        'date' => $r->attendance_date->toDateString(),
                        'status' => $r->attendance_status,
                        'totalPay' => (float) $r->total_pay,
                    ])->values()->all(),
                ],
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function applyPayrollFormula(array $row): array
    {
        $totalBillableHours = round(
            (float) $row['basicWorkHours']
            + (float) $row['weekdayOvertimeWeightedHours']
            + (float) $row['fridayOvertimeWeightedHours'],
            2
        );
        $actualPay = round((float) $row['hourlyRate'] * $totalBillableHours, 2);
        $deduction = round(max(0, (float) $row['basicSalary'] - $actualPay), 2);

        return array_merge($row, [
            'totalBillableHours' => $totalBillableHours,
            'actualPay' => $actualPay,
            'netPay' => $actualPay,
            'totalPay' => $actualPay,
            'deduction' => $deduction,
        ]);
    }

    /**
     * @param  Collection<int, AttendanceRecord>  $rows
     */
    private function lastRecordLeaveHint(Collection $rows): ?string
    {
        if ($rows->isEmpty()) {
            return null;
        }

        /** @var AttendanceRecord|null $last */
        $last = $rows->sortBy(fn (AttendanceRecord $r) => $r->attendance_date)->last();
        if (! $last) {
            return null;
        }

        return match ($last->attendance_status) {
            'paid_leave' => 'آخر سجل: إجازة مدفوعة',
            'unpaid_leave' => 'آخر سجل: إجازة غير مدفوعة',
            'leave' => 'آخر سجل: إجازة',
            default => null,
        };
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $items
     * @return array{regularPay: float, overtimePay: float, fridayOvertimePay: float, totalPay: float}
     */
    private function sumTotals(Collection $items): array
    {
        $actualPay = round((float) $items->sum('actualPay'), 2);

        return [
            'regularPay' => round((float) $items->sum('regularPay'), 2),
            'overtimePay' => round((float) $items->sum('overtimePay'), 2),
            'fridayOvertimePay' => round((float) $items->sum('fridayOvertimePay'), 2),
            'actualPay' => $actualPay,
            'totalPay' => $actualPay,
        ];
    }
}
