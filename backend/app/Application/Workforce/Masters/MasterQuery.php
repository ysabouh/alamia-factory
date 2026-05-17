<?php

namespace App\Application\Workforce\Masters;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

final class MasterQuery
{
    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public function apply(Request $request, Builder $query, array $searchColumns = ['name', 'code']): Builder
    {
        if ($request->has('isActive')) {
            $query->where('is_active', $request->boolean('isActive'));
        }

        if ($s = trim((string) $request->query('search', ''))) {
            $query->where(function (Builder $w) use ($s, $searchColumns): void {
                foreach ($searchColumns as $i => $col) {
                    $method = $i === 0 ? 'where' : 'orWhere';
                    $w->{$method}($col, 'like', "%{$s}%");
                }
            });
        }

        return $query;
    }

    /**
     * @return array{page: int, pageSize: int, total: int, totalPages: int}
     */
    public function paginateMeta(Request $request, int $total): array
    {
        $page = max(1, (int) $request->query('page', 1));
        $pageSize = min(100, max(1, (int) $request->query('pageSize', 20)));

        return [
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
            'totalPages' => max(1, (int) ceil($total / $pageSize)),
        ];
    }
}
