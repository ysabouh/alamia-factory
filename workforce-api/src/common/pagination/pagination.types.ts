export type SortOrder = "asc" | "desc";

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export function buildPaginatedMeta(
  page: number,
  pageSize: number,
  total: number
): PaginatedMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return { page, pageSize, total, totalPages };
}

export function prismaSkipTake(page: number, pageSize: number): {
  skip: number;
  take: number;
} {
  const p = Number.isFinite(page) && page > 0 ? page : 1;
  const ps = Number.isFinite(pageSize) ? Math.min(100, Math.max(1, pageSize)) : 20;

  return { skip: (p - 1) * ps, take: ps };
}
