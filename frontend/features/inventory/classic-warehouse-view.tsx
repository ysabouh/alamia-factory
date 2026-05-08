"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Barcode,
  ClipboardList,
  Filter,
  Printer,
  ScanBarcode,
  Search,
  SlidersHorizontal,
  Truck
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { LiveDashboard } from "@/types/factory";

import type { MaterialCategory, MaterialItem } from "./inventory-mock-data";
import { categoryLabelAr, mockMaterials } from "./inventory-mock-data";

type MovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT" | "PRODUCTION_CONSUMPTION";

interface StockRow extends MaterialItem {
  warehouse: string;
  minStock: number;
  status: "ok" | "low" | "quarantine";
}

interface MovementRow {
  id: string;
  time: string;
  type: MovementType;
  itemCode: string;
  qty: number;
  unit: string;
  reference: string;
  user: string;
}

const mockMovements: MovementRow[] = [
  { id: "1", time: "08:41", type: "IN", itemCode: "M-PP-01", qty: 2000, unit: "كغ", reference: "PO-8921 · استلام", user: "م. سعد" },
  { id: "2", time: "09:05", type: "PRODUCTION_CONSUMPTION", itemCode: "M-PP-01", qty: -420, unit: "كغ", reference: "WO-3041 · INJ-01", user: "MES" },
  { id: "3", time: "10:22", type: "TRANSFER", itemCode: "M-MB-02", qty: -40, unit: "كغ", reference: "A-02 → B خط نفخ", user: "مخزن" },
  { id: "4", time: "11:10", type: "OUT", itemCode: "P-CAR-20", qty: -120, unit: "صندوق", reference: "شحنة SH-771", user: "لوجستيات" },
  { id: "5", time: "13:47", type: "ADJUSTMENT", itemCode: "M-MB-02", qty: -2.5, unit: "كغ", reference: "جرد دوري CY-12", user: "مراقب" },
  { id: "6", time: "15:02", type: "IN", itemCode: "S-HYD-77", qty: 4, unit: "قطعة", reference: "استلام صيانة", user: "صيانة" }
];

const movementLabel: Record<MovementType, string> = {
  IN: "وارد",
  OUT: "صادر",
  TRANSFER: "نقل",
  ADJUSTMENT: "تسوية",
  PRODUCTION_CONSUMPTION: "استهلاك إنتاج"
};

const movementVariant: Record<MovementType, "success" | "secondary" | "warning" | "destructive" | "info"> = {
  IN: "success",
  OUT: "secondary",
  TRANSFER: "info",
  ADJUSTMENT: "warning",
  PRODUCTION_CONSUMPTION: "destructive"
};

function toRows(materials: MaterialItem[]): StockRow[] {
  return materials.map((m) => {
    const minStock =
      m.unit === "قطعة" || m.unit === "صندوق"
        ? Math.max(50, Math.round(m.qty * 0.05))
        : Math.max(100, Math.round(m.consumptionKgPerDay * 7));
    const low = m.qty < minStock || m.remainingDays < 10;
    const quarantine = m.quality === "inspect" || m.quality === "hold";
    return {
      ...m,
      warehouse: m.location.startsWith("S-") ? "مستودع الصيانة" : m.location.startsWith("SHIP") ? "منطقة الشحن" : "المستودع الرئيسي",
      minStock,
      status: quarantine ? "quarantine" : low ? "low" : "ok"
    };
  });
}

type Overview = {
  totalVal: number;
  critical: number;
  dailyUse: number;
  wastePct: number;
  openPO: number;
  utilization: number;
};

function KpiTile({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex min-h-[5.5rem] min-w-[min(100%,7.75rem)] flex-1 basis-full flex-col justify-center gap-1.5 rounded-xl border border-border bg-muted/40 px-4 py-3.5 text-center sm:basis-[calc(50%-6px)] md:basis-0 md:py-4">
      <span className="text-[11px] font-medium leading-snug text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-bold tabular-nums leading-none tracking-tight sm:text-xl", valueClassName)}>{value}</span>
    </div>
  );
}

type Props = { dashboard: LiveDashboard; overview: Overview };

export function ClassicWarehouseView({ dashboard, overview }: Props) {
  const rows = useMemo(() => toRows(mockMaterials), []);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<MaterialCategory | "all">("all");
  const [wh, setWh] = useState<string>("all");
  const [movFilter, setMovFilter] = useState<MovementType | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [barcodeFocus, setBarcodeFocus] = useState(false);

  const warehouses = useMemo(() => Array.from(new Set(rows.map((r) => r.warehouse))), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const text = `${r.id} ${r.name} ${r.supplier}`.toLowerCase();
      const okQ = text.includes(q.toLowerCase());
      const okC = cat === "all" || r.category === cat;
      const okW = wh === "all" || r.warehouse === wh;
      return okQ && okC && okW;
    });
  }, [rows, q, cat, wh]);

  const movements = useMemo(
    () => (movFilter === "all" ? mockMovements : mockMovements.filter((m) => m.type === movFilter)),
    [movFilter]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  }

  function mockAction(label: string) {
    if (typeof window !== "undefined") window.alert(`[وضع تجريبي] ${label}`);
  }

  const statusBadge = (s: StockRow["status"]) => {
    if (s === "low") return <Badge variant="warning">منخفض</Badge>;
    if (s === "quarantine") return <Badge variant="destructive">حجر</Badge>;
    return <Badge variant="success">جاهز</Badge>;
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <Card className="erp-card rounded-2xl border-border print:hidden">
        {/* CardContent الافتراضي يستخدم pt-0؛ نفرض حشو متساوي حتى لا تلتصق البطاقات بأعلى الإطار */}
        <CardContent className="flex flex-wrap items-stretch gap-3 px-5 pb-5 pt-5 md:px-6 md:pb-6 md:pt-6">
          <KpiTile label="قيمة تقديرية" value={`${overview.totalVal}K $`} valueClassName="text-foreground" />
          <KpiTile label="بنود حرجة" value={String(overview.critical)} valueClassName="text-amber-600 dark:text-amber-400" />
          <KpiTile label="منخفض النظام" value={String(dashboard.kpis.lowStockItems)} valueClassName="text-foreground" />
          <KpiTile label="استخدام المستودع" value={`${overview.utilization}%`} valueClassName="text-foreground" />
        </CardContent>
      </Card>

      <Card id="classic-inventory-print-area" className="erp-card overflow-hidden rounded-2xl">
        <CardHeader className="space-y-4 border-b border-border pb-4 print:border-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">جرد المستودع — العرض التشغيلي</CardTitle>
              <p className="text-xs text-muted-foreground">بحث سريع · باركود · حركات · جاهز للطباعة</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => mockAction("نقل بين مواقع")}>
                <ArrowLeftRight className="h-4 w-4" />
                نقل
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => mockAction("تسوية مخزون")}>
                <SlidersHorizontal className="h-4 w-4" />
                تسوية
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => mockAction("جرد دوري")}>
                <ClipboardList className="h-4 w-4" />
                جرد
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => mockAction("استلام مشتريات")}>
                <Truck className="h-4 w-4" />
                استلام
              </Button>
              <Button size="sm" variant="secondary" className="gap-1 print:hidden" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 print:hidden">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pr-9" placeholder="بحث بالكود أو الاسم أو المورد..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="relative">
              <ScanBarcode
                className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${barcodeFocus ? "text-primary" : "text-muted-foreground"}`}
              />
              <Input
                className="pr-9 font-mono text-sm"
                placeholder="مسح الباركود..."
                onFocus={() => setBarcodeFocus(true)}
                onBlur={() => setBarcodeFocus(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) {
                      mockAction(`تسجيل باركود: ${v}`);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <select
                className="h-10 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
                value={cat}
                onChange={(e) => setCat(e.target.value as MaterialCategory | "all")}
              >
                <option value="all">كل الفئات</option>
                {(Object.keys(categoryLabelAr) as MaterialCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {categoryLabelAr[c]}
                  </option>
                ))}
              </select>
              <select className="h-10 flex-1 rounded-lg border border-input bg-background px-2 text-sm" value={wh} onChange={(e) => setWh(e.target.value)}>
                <option value="all">كل المستودعات</option>
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selected.size > 0 ? (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2 print:hidden">
              <Barcode className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-medium">محدّد: {selected.size}</span>
              <Button size="sm" variant="outline" onClick={() => mockAction("طباعة ملصقات الباركود")}>
                طباعة ملصقات
              </Button>
              <Button size="sm" variant="outline" onClick={() => mockAction("تصدير CSV")}>
                تصدير
              </Button>
              <Button size="sm" variant="outline" onClick={() => mockAction("طلب تحويل مجمع")}>
                تحويل مجمع
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                إلغاء التحديد
              </Button>
            </motion.div>
          ) : null}
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-right text-sm">
              <thead className="border-b border-border bg-muted/40 text-[11px] text-muted-foreground">
                <tr>
                  <th className="w-10 p-3 print:hidden">
                    <input type="checkbox" className="rounded border-input" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} aria-label="تحديد الكل" />
                  </th>
                  <th className="p-3 font-medium">كود الصنف</th>
                  <th className="p-3 font-medium">اسم الصنف</th>
                  <th className="p-3 font-medium">الفئة</th>
                  <th className="p-3 font-medium">الكمية</th>
                  <th className="p-3 font-medium">الوحدة</th>
                  <th className="p-3 font-medium">المستودع</th>
                  <th className="p-3 font-medium">الحد الأدنى</th>
                  <th className="p-3 font-medium">التكلفة</th>
                  <th className="p-3 font-medium">المورد</th>
                  <th className="p-3 font-medium">الحالة</th>
                  <th className="w-24 p-3 font-medium print:hidden">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="p-2 print:hidden">
                      <input type="checkbox" className="rounded border-input" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                    </td>
                    <td className="p-2 font-mono text-xs">{r.id}</td>
                    <td className="p-2 font-medium">{r.name}</td>
                    <td className="p-2 text-muted-foreground">{categoryLabelAr[r.category]}</td>
                    <td className="p-2 tabular-nums">{r.qty.toLocaleString("ar")}</td>
                    <td className="p-2">{r.unit}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {r.warehouse}
                      <span className="block text-[10px]">رف: {r.location}</span>
                    </td>
                    <td className="p-2 tabular-nums text-muted-foreground">{r.minStock.toLocaleString("ar")}</td>
                    <td className="p-2 tabular-nums">${r.unitCost}</td>
                    <td className="p-2 text-xs">{r.supplier}</td>
                    <td className="p-2">{statusBadge(r.status)}</td>
                    <td className="p-2 print:hidden">
                      <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
                        <Link href={"/ar/production/operations" as Route}>حركة</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="erp-card rounded-2xl print:hidden">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            حركات المخزون
          </CardTitle>
          <div className="flex flex-wrap gap-1">
            <FilterPill label="الكل" active={movFilter === "all"} onClick={() => setMovFilter("all")} />
            {(Object.keys(movementLabel) as MovementType[]).map((t) => (
              <FilterPill key={t} label={movementLabel[t]} active={movFilter === t} onClick={() => setMovFilter(t)} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead className="border-b border-border bg-muted/30 text-[11px] text-muted-foreground">
                <tr>
                  <th className="p-2">الوقت</th>
                  <th className="p-2">النوع</th>
                  <th className="p-2">الصنف</th>
                  <th className="p-2">الكمية</th>
                  <th className="p-2">المرجع</th>
                  <th className="p-2">المستخدم</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-border/50">
                    <td className="p-2 font-mono text-xs">{m.time}</td>
                    <td className="p-2">
                      <Badge variant={movementVariant[m.type]}>{movementLabel[m.type]}</Badge>
                    </td>
                    <td className="p-2 font-mono text-xs">{m.itemCode}</td>
                    <td className={`p-2 tabular-nums ${m.qty < 0 ? "text-rose-500" : "text-emerald-600"}`}>
                      {m.qty > 0 ? "+" : ""}
                      {m.qty.toLocaleString("ar")} {m.unit}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{m.reference}</td>
                    <td className="p-2 text-xs">{m.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] transition ${active ? "border-primary bg-primary/15 text-primary" : "border-border bg-background"}`}
    >
      {label}
    </button>
  );
}
