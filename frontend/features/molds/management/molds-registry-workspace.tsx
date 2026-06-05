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
import { Layers, Plus, Search } from "lucide-react";

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
  moldStatusBadgeVariant,
  moldStatusLabels,
  moldTypeBadgeVariant,
  moldTypeLabels,
  moldTypeShortLabels
} from "@/features/molds/management/mold-status-ui";
import { MoldStatsPanel } from "@/features/molds/management/mold-stats-panel";
import {
  moldsApi,
  MoldsApiError,
  type MoldJson,
  type MoldStatus,
  type MoldType
} from "@/lib/api/molds-client";

const PAGE_SIZE = 20;

export function MoldsRegistryWorkspace() {
  const { can } = useFactoryAuth();
  const canManage = can("molds.manage");

  const [rows, setRows] = useState<MoldJson[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MoldType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | MoldStatus>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await moldsApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        moldType: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter
      });
      setRows(res.data);
      setTotal(res.meta.total);
      setError(null);
    } catch (e) {
      if (e instanceof MoldsApiError && (e.status === 401 || e.status === 403)) {
        setError("لا توجد صلاحية عرض القوالب.");
      } else {
        setError("تعذر تحميل القوالب");
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<MoldJson>[]>(
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
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
          )
      },
      {
        id: "code",
        header: "الرمز",
        cell: ({ row }) => (
          <Link
            href={`/ar/molds/${row.original.id}` as Route}
            className="font-mono font-medium text-primary hover:underline"
          >
            {row.original.moldCode}
          </Link>
        )
      },
      { id: "name", header: "الاسم", accessorKey: "moldName" },
      {
        id: "type",
        header: "النوع",
        cell: ({ row }) => (
          <Badge variant={moldTypeBadgeVariant(row.original.moldType)}>
            {row.original.moldType === "polyethylene"
              ? `PE · ${moldTypeShortLabels.polyethylene}`
              : moldTypeLabels[row.original.moldType]}
          </Badge>
        )
      },
      {
        id: "status",
        header: "الحالة",
        cell: ({ row }) => (
          <Badge variant={moldStatusBadgeVariant(row.original.status)}>
            {moldStatusLabels[row.original.status]}
          </Badge>
        )
      },
      { id: "cavities", header: "تجاويف", accessorKey: "cavityCount" },
      {
        id: "machine",
        header: "الماكينة",
        cell: ({ row }) => row.original.machineCode ?? "—"
      },
      {
        id: "cycles",
        header: "الدورات",
        cell: ({ row }) => row.original.totalCycles.toLocaleString("ar")
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) =>
          canManage ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/ar/molds/${row.original.id}/edit` as Route}>تعديل</Link>
            </Button>
          ) : null
      }
    ],
    [canManage]
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">سجل الأصول</p>
          <h1 className="text-2xl font-semibold">إدارة القوالب</h1>
        </div>
        {canManage && (
          <Button asChild>
            <Link href={"/ar/molds/new" as Route}>
              <Plus className="ms-2 h-4 w-4" />
              إضافة قالب
            </Link>
          </Button>
        )}
      </div>

      <MoldStatsPanel />

      <Card className="border-border/60 bg-card/30">
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <Search className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder="رمز، اسم، منتج…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput);
                  setPage(1);
                }
              }}
            />
          </div>
          <WfmSelect
            className="w-[160px]"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as typeof typeFilter);
              setPage(1);
            }}
          >
            <option value="all">كل الأنواع</option>
            {(Object.keys(moldTypeLabels) as MoldType[]).map((t) => (
              <option key={t} value={t}>
                {moldTypeLabels[t]}
              </option>
            ))}
          </WfmSelect>
          <WfmSelect
            className="w-[140px]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
          >
            <option value="all">كل الحالات</option>
            {(Object.keys(moldStatusLabels) as MoldStatus[]).map((s) => (
              <option key={s} value={s}>
                {moldStatusLabels[s]}
              </option>
            ))}
          </WfmSelect>
          <Button
            variant="secondary"
            onClick={() => {
              setSearch(searchInput);
              setPage(1);
            }}
          >
            بحث
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card className="border-border/60 bg-card/20">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                    جاري التحميل…
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                    لا توجد قوالب
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          صفحة {page} من {totalPages} — {total} قالب
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}
