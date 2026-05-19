<?php

namespace App\Interfaces\Http\Controllers\Api\V1\Masters;

use App\Application\Workforce\Masters\MasterQuery;
use App\Domain\Factory\Models\Currency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CurrenciesMasterController
{
    public function __construct(
        private readonly MasterQuery $masterQuery
    ) {}

    public function index(Request $request): JsonResponse
    {
        $q = $this->masterQuery->apply($request, Currency::query());
        $total = (clone $q)->count();
        $meta = $this->masterQuery->paginateMeta($request, $total);
        $rows = $q->orderByDesc('is_base')->orderBy('code')->forPage($meta['page'], $meta['pageSize'])->get();

        return response()->json([
            'data' => $rows->map(fn (Currency $c) => $this->serialize($c))->values()->all(),
            'meta' => $meta,
        ]);
    }

    public function show(Currency $currency): JsonResponse
    {
        return response()->json($this->serialize($currency));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        if ($data['is_base']) {
            throw ValidationException::withMessages([
                'isBase' => [__('factory.currency_base_immutable')],
            ]);
        }

        $currency = Currency::create($data);

        return response()->json([
            'message' => __('factory.master_created'),
            'data' => $this->serialize($currency),
        ], JsonResponse::HTTP_CREATED);
    }

    public function update(Request $request, Currency $currency): JsonResponse
    {
        $data = $this->validated($request, $currency->id, $currency);
        $currency->fill($data);
        $currency->save();

        return response()->json([
            'message' => __('factory.master_updated'),
            'data' => $this->serialize($currency),
        ]);
    }

    public function activate(Currency $currency): JsonResponse
    {
        $currency->is_active = true;
        $currency->save();

        return response()->json([
            'message' => __('factory.master_activated'),
            'data' => $this->serialize($currency),
        ]);
    }

    public function deactivate(Currency $currency): JsonResponse
    {
        if ($currency->is_base) {
            throw ValidationException::withMessages([
                'code' => [__('factory.currency_base_cannot_deactivate')],
            ]);
        }

        $currency->is_active = false;
        $currency->save();

        return response()->json([
            'message' => __('factory.master_deactivated'),
            'data' => $this->serialize($currency),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null, ?Currency $existing = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'size:3', Rule::unique('currencies', 'code')->ignore($ignoreId)],
            'symbol' => ['required', 'string', 'max:16'],
            'usdExchangeRate' => ['sometimes', 'numeric', 'gt:0'],
            'usd_exchange_rate' => ['sometimes', 'numeric', 'gt:0'],
            'isActive' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $code = strtoupper(trim($data['code']));
        $rate = (float) ($data['usdExchangeRate'] ?? $data['usd_exchange_rate'] ?? ($existing?->usd_exchange_rate ?? 1));

        if ($existing?->is_base || $code === 'USD') {
            $rate = 1.0;
            $code = 'USD';
        }

        return [
            'name' => $data['name'],
            'code' => $code,
            'symbol' => $data['symbol'],
            'usd_exchange_rate' => round($rate, 6),
            'is_base' => $existing?->is_base ?? false,
            'is_active' => array_key_exists('isActive', $data) || array_key_exists('is_active', $data)
                ? $request->boolean('isActive', $request->boolean('is_active'))
                : ($existing?->is_active ?? true),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Currency $currency): array
    {
        return [
            'id' => (string) $currency->id,
            'code' => $currency->code,
            'name' => $currency->name,
            'symbol' => $currency->symbol,
            'usdExchangeRate' => (float) $currency->usd_exchange_rate,
            'isBase' => (bool) $currency->is_base,
            'isActive' => (bool) $currency->is_active,
        ];
    }
}
