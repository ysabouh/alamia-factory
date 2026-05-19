<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Attendance;

use App\Application\Attendance\PayrollGeneratorService;
use App\Domain\Factory\Models\Payroll;
use App\Interfaces\Http\Support\SerializesAttendance;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PayrollsController
{
    use SerializesAttendance;

    public function __construct(
        private readonly PayrollGeneratorService $generator,
    ) {}

    public function index(): JsonResponse
    {
        $rows = Payroll::query()->orderByDesc('year')->orderByDesc('month')->limit(24)->get();

        return response()->json([
            'data' => $rows->map(fn (Payroll $p) => $this->serializePayroll($p))->values(),
        ]);
    }

    public function show(Payroll $payroll): JsonResponse
    {
        $payroll->load('items.employee');

        return response()->json(['data' => $this->serializePayroll($payroll)]);
    }

    public function preview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'periodStart' => ['sometimes', 'date'],
            'periodEnd' => ['sometimes', 'date', 'after_or_equal:periodStart'],
            'periods' => ['sometimes', 'array', 'min:1'],
            'periods.*.periodStart' => ['required_with:periods', 'date'],
            'periods.*.periodEnd' => ['required_with:periods', 'date'],
        ]);

        $periods = $data['periods'] ?? null;
        $periodStart = isset($data['periodStart']) ? Carbon::parse($data['periodStart']) : null;
        $periodEnd = isset($data['periodEnd']) ? Carbon::parse($data['periodEnd']) : null;

        return response()->json([
            'data' => $this->generator->preview((int) $data['year'], (int) $data['month'], $periodStart, $periodEnd, $periods),
        ]);
    }

    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
        ]);

        $payroll = $this->generator->generate((int) $data['year'], (int) $data['month'], $request->user()?->id);
        $payroll->load('items.employee');

        return response()->json(['data' => $this->serializePayroll($payroll)], 201);
    }

    public function export(Payroll $payroll): StreamedResponse
    {
        $payroll->load('items.employee');

        return response()->streamDownload(function () use ($payroll): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['employeeNumber', 'fullName', 'daysPresent', 'daysAbsent', 'regularPay', 'overtimePay', 'fridayOvertimePay', 'totalPay']);
            foreach ($payroll->items as $item) {
                fputcsv($out, [
                    $item->employee?->employee_number,
                    $item->employee?->full_name,
                    $item->days_present,
                    $item->days_absent,
                    $item->regular_pay,
                    $item->overtime_pay,
                    $item->friday_overtime_pay,
                    $item->total_pay,
                ]);
            }
            fclose($out);
        }, "payroll-{$payroll->year}-{$payroll->month}.csv", [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
