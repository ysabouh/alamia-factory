"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";
import { LayoutGrid, List, Package, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { WfmSelect } from "@/components/workforce/atlas";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import {
  manufacturingBadgeVariant,
  manufacturingTypeLabels,
  productStatusLabels,
  productTypeBadgeVariant,
  productTypeLabels
} from "@/features/products/management/product-status-ui";
import {
  productsApi,
  ProductsApiError,
  type ManufacturingType,
  type ProductJson,
  type ProductStatus,
  type ProductType
} from "@/lib/api/products-client";

const PAGE_SIZE = 20;

export function ProductsRegistryWorkspace() {
  const { can } = useFactoryAuth();
  const canManage = can("products.manage");

  const [rows, setRows] = useState<ProductJson[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "grid">("table");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ProductType>("all");
  const [mfgFilter, setMfgFilter] = useState<"all" | ManufacturingType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductStatus>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        productType: typeFilter,
        manufacturingType: mfgFilter,
        productStatus: statusFilter
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setError(null);
    } catch (e) {
      if (e instanceof ProductsApiError && (e.status === 401 || e.status === 403)) {
        setError("لا توجد صلاحية عرض المنتجات.");
      } else {
        setError("تعذر تحميل المنتجات");
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, mfgFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<ProductJson>[]>(
    () => [
      {
        id: "thumb",
        header: "",
        cell: ({ row }) =>
          row.original.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted/30">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          )
      },
      {
        accessorKey: "productCode",
        header: "الرمز",
        cell: ({ row }) => (
          <Link href={`/ar/products/${row.original.id}` as Route} className="font-medium text-primary hover:underline">
            {row.original.productCode}
          </Link>
        )
      },
      { accessorKey: "productNameAr", header: "الاسم" },
      {
        id: "productType",
        header: "النوع",
        cell: ({ row }) => (
          <Badge variant={productTypeBadgeVariant(row.original.productType)}>
            {productTypeLabels[row.original.productType]}
          </Badge>
        )
      },
      {
        id: "manufacturingType",
        header: "التصنيع",
        cell: ({ row }) =>
          row.original.manufacturingType ? (
            <Badge variant={manufacturingBadgeVariant(row.original.manufacturingType)}>
              {manufacturingTypeLabels[row.original.manufacturingType]}
            </Badge>
          ) : (
            "—"
          )
      },
      {
        id: "status",
        header: "الحالة",
        cell: ({ row }) => productStatusLabels[row.original.productStatus]
      }
    ],
    []
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">سجل المنتجات</h1>
          <p className="text-sm text-muted-foreground">Product Master — مركز بيانات التصنيع</p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href={"/ar/products/new" as Route}>
              <Plus className="ml-2 h-4 w-4" />
              منتج جديد
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-border/60 bg-card/30">
        <CardHeader>
          <CardTitle className="text-base">بحث وتصفية</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pr-9"
              placeholder="بحث بالرمز أو الاسم أو الباركود…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setSearch(searchInput.trim());
                }
              }}
            />
          </div>
          <WfmSelect value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }}>
            <option value="all">كل الأنواع</option>
            {Object.entries(productTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </WfmSelect>
          <WfmSelect value={mfgFilter} onChange={(e) => { setMfgFilter(e.target.value as typeof mfgFilter); setPage(1); }}>
            <option value="all">كل التصنيع</option>
            {Object.entries(manufacturingTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </WfmSelect>
          <WfmSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}>
            <option value="all">كل الحالات</option>
            {Object.entries(productStatusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </WfmSelect>
          <div className="flex gap-1">
            <Button type="button" size="icon" variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>
              <List className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive">{error}</p>}

      {view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((p) => (
            <Link key={p.id} href={`/ar/products/${p.id}` as Route}>
              <Card className="h-full border-border/60 transition hover:border-primary/40">
                <CardContent className="p-4">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="mb-3 aspect-video w-full rounded object-cover" />
                  ) : (
                    <div className="mb-3 flex aspect-video items-center justify-center rounded bg-muted/20">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <p className="font-semibold">{p.productNameAr}</p>
                  <p className="text-xs text-muted-foreground">{p.productCode}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant={productTypeBadgeVariant(p.productType)}>{productTypeLabels[p.productType]}</Badge>
                    {p.manufacturingType && (
                      <Badge variant="outline">{manufacturingTypeLabels[p.manufacturingType]}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                    جاري التحميل…
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                    لا توجد منتجات
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} منتج</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <span>
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}
