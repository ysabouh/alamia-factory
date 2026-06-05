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
import { Factory, Plus, Search } from "lucide-react";

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
import { getMachineStateVisual } from "@/components/factory/machine-state";
import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { machineStatusLabels } from "@/features/machines/management/machine-status-ui";
import {
  machinesApi,
  MachinesApiError,
  type MachineJson,
  type MachineRegistryStatus
} from "@/lib/api/machines-client";

const PAGE_SIZE = 20;

export function MachinesRegistryWorkspace() {
  const { can } = useFactoryAuth();
  const canManage = can("machines.manage");

  const [rows, setRows] = useState<MachineJson[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MachineRegistryStatus>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActive =
        activeFilter === "all" ? ("all" as const) : activeFilter === "active";
      const res = await machinesApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        isActive
      });
      setRows(res.data);
      setTotal(res.meta.total);
    } catch (e) {
      if (e instanceof MachinesApiError) {
        if (e.status === 401 || e.status === 403) {
          setError("لا توجد صلاحية عرض الماكينات — سجّل خروجاً ثم ادخل مجدداً بمستخدم admin.");
        } else {
          setError(e.message);
        }
      } else {
        setError("تعذر تحميل الماكينات — تأكد أن Laravel يعمل على المنفذ 8000");
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, activeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<MachineJson>[]>(
    () => [
      {
        id: "code",
        header: "الرمز",
        accessorKey: "code",
        cell: ({ row }) => (
          <Link
            href={`/ar/machines/${row.original.id}` as Route}
            className="font-mono text-cyan-300 hover:underline"
          >
            {row.original.code}
          </Link>
        )
      },
      { id: "name", header: "الاسم", accessorKey: "name" },
      {
        id: "type",
        header: "النوع",
        cell: ({ row }) => row.original.typeName ?? row.original.type ?? "—"
      },
      {
        id: "status",
        header: "الحالة",
        cell: ({ row }) => {
          const visual = getMachineStateVisual(row.original.status);
          return (
            <Badge variant="outline" className={visual.panelClass}>
              {machineStatusLabels[row.original.status]}
            </Badge>
          );
        }
      },
      {
        id: "todayProduced",
        header: "إنتاج اليوم",
        cell: ({ row }) => row.original.todayProducedUnits.toLocaleString("ar")
      },
      {
        id: "openBreakdown",
        header: "أعطال مفتوحة",
        cell: ({ row }) =>
          row.original.openBreakdownCount > 0 ? (
            <Badge variant="destructive">{row.original.openBreakdownCount}</Badge>
          ) : (
            "—"
          )
      },
      {
        id: "actions",
        header: "إجراءات",
        cell: ({ row }) =>
          canManage ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/ar/machines/${row.original.id}/edit` as Route}>تعديل</Link>
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
          <h1 className="text-2xl font-semibold">إدارة الماكينات</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={"/ar/machines" as Route}>عرض الأرضية الحية</Link>
          </Button>
          {canManage && (
            <Button asChild>
              <Link href={"/ar/machines/new" as Route}>
                <Plus className="ms-2 h-4 w-4" />
                إضافة ماكينة
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/60 bg-card/30">
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 space-y-0">
          <Factory className="h-5 w-5 text-cyan-400" />
          <CardTitle className="text-base">البحث والتصفية</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder="رمز، اسم، تسلسلي…"
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
          >
            <option value="all">كل الحالات</option>
            {(Object.keys(machineStatusLabels) as MachineRegistryStatus[]).map((s) => (
              <option key={s} value={s}>
                {machineStatusLabels[s]}
              </option>
            ))}
          </WfmSelect>
          <WfmSelect
            className="w-[140px]"
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value as typeof activeFilter);
              setPage(1);
            }}
          >
            <option value="all">الكل</option>
            <option value="active">نشطة</option>
            <option value="inactive">معطّلة</option>
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
                    لا توجد ماكينات
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
          صفحة {page} من {totalPages} — {total} ماكينة
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}
