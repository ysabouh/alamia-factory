"use client";

import type React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Baby,
  Brain,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  CircleDot,
  Cpu,
  FileText,
  GitBranch,
  HeartPulse,
  Landmark,
  Layers2,
  MapPin,
  Palmtree,
  Plane,
  RefreshCw,
  Search,
  Timer,
  Factory,
  UserPlus,
  Wallet,
  Workflow,
  GraduationCap
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LiveDashboard } from "@/types/factory";

import type { OpsEmployee } from "./workforce-models";

type CalView = "daily" | "weekly" | "monthly" | "shift";

function seed(s: string, m: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % m;
}

export const LEAVE_TYPE_CATALOG = [
  {
    key: "annual",
    name: "إجازة سنوية",
    icon: Palmtree,
    approval: "مشرف إنتاج ← موارد بشرية",
    payroll: "مدفوعة · لا خصم",
    docs: "نموذج طلب + موافقة مسبقة",
    restrict: "حد أقصى 25% من القسم في نفس الأسبوع"
  },
  {
    key: "sick",
    name: "إجازة مرضية",
    icon: HeartPulse,
    approval: "مشرف ← طبابة/موارد بشرية",
    payroll: "مدفوعة حسب السياسة · فترة انتظار يومان",
    docs: "تقرير طبي معتمد",
    restrict: "الإنتاج الحرج: إشعار MES"
  },
  {
    key: "emergency",
    name: "إجازة طارئة",
    icon: AlertTriangle,
    approval: "مشرف فوري ← إدارة المصنع",
    payroll: "تُحتسب ضمن الحد السنوي أو غير مدفوعة",
    docs: "سبب عاجل + إثبات لاحق",
    restrict: "قاعات الحقن: موافقة إضافية"
  },
  {
    key: "unpaid",
    name: "إجازة بدون راتب",
    icon: Wallet,
    approval: "موارد بشرية ← إدارة",
    payroll: "خصم يومي كامل من المسير",
    docs: "طلب خطي",
    restrict: "لا تُمنح أثناء ذروة الخطط التشغيلية"
  },
  {
    key: "maternity",
    name: "إجازة أمومة",
    icon: Baby,
    approval: "موارد بشرية ← الامتثال",
    payroll: "مدفوعة · جدولة استبدال طويلة",
    docs: "مستندات رسمية",
    restrict: "تخطيط تغطية إلزامي"
  },
  {
    key: "holiday",
    name: "عطلة رسمية",
    icon: Landmark,
    approval: "تقويم المصنع (تلقائي)",
    payroll: "مدفوعة · لا خصم",
    docs: "—",
    restrict: "تُدمج في جدول MES"
  },
  {
    key: "shift_comp",
    name: "إجازة تعويض وردية",
    icon: RefreshCw,
    approval: "مخطط ورديات",
    payroll: "تعويض يوم/ساعات حسب الاتفاق",
    docs: "سجل وردية",
    restrict: "مرتبطة بساعات إضافي معتمدة"
  },
  {
    key: "training",
    name: "إجازة تدريب",
    icon: GraduationCap,
    approval: "التدريب ← المشرف",
    payroll: "مدفوعة كيوم عمل",
    docs: "خطة تدريب معتمدة",
    restrict: "لا تتعارض مع صيانة مجدولة"
  }
] as const;

type FinanceSnap = {
  laborDaily: number;
  payrollMonth: number;
  wasteRate: number;
};

type Props = {
  employees: OpsEmployee[];
  dashboard: LiveDashboard;
  fin: FinanceSnap;
};

export function SmartLeaveVacationModule({ employees, dashboard, fin }: Props) {
  const [calView, setCalView] = useState<CalView>("monthly");
  const [reqType, setReqType] = useState<string>("annual");
  const [reqHall, setReqHall] = useState<string>("قاعة الحقن");
  const [reqShift, setReqShift] = useState<string>("صباحي");
  const [reqDays, setReqDays] = useState(3);
  const [reqEmergency, setReqEmergency] = useState(false);
  const [reqReason, setReqReason] = useState("");
  const [searchEmp, setSearchEmp] = useState("");

  const leaveIntel = useMemo(() => buildLeaveIntel(employees, dashboard), [employees, dashboard]);

  const smartWarnings = useMemo(
    () => analyzeRequest({ reqType, reqHall, reqShift, reqDays, reqEmergency, dashboard, employees, leaveIntel }),
    [reqType, reqHall, reqShift, reqDays, reqEmergency, dashboard, employees, leaveIntel]
  );

  const replacements = useMemo(
    () => suggestReplacements(employees, reqHall, reqShift),
    [employees, reqHall, reqShift]
  );

  const filteredBalances = leaveIntel.balances.filter((b) =>
    searchEmp.trim() ? b.name.includes(searchEmp.trim()) : true
  );

  const extraAlerts = useMemo(
    () => [
      leaveIntel.shortageDept
        ? { tag: "تغطية", msg: `نقص حرجة في ${leaveIntel.shortageDept} خلال الأسبوع القادم`, tone: "warn" as const }
        : null,
      {
        tag: "وردية ليلية",
        msg: seed("night", 10) > 6 ? "خطورة تغطية — الوردية الليلية في قاعة النفخ" : "وردية ليلية ضمن الهدف",
        tone: seed("night", 10) > 6 ? ("crit" as const) : ("info" as const)
      },
      {
        tag: "إنتاج",
        msg:
          dashboard.kpis.machineUtilization > 78
            ? "أسبوع إنتاج مرتفع — مراجعة طلبات الإجازة الجماعية"
            : "حمولة إنتاج متوسطة — نافذة مناسبة للإجازات القصيرة",
        tone: dashboard.kpis.machineUtilization > 78 ? ("warn" as const) : ("info" as const)
      }
    ].filter(Boolean) as Array<{ tag: string; msg: string; tone: "info" | "warn" | "crit" }>,
    [leaveIntel.shortageDept, dashboard.kpis.machineUtilization]
  );

  return (
    <section className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="erp-card rounded-2xl border border-violet-500/25 bg-gradient-to-br from-card via-card to-violet-500/5 p-5"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
              <Plane className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.28em] text-violet-600 dark:text-violet-300">OPS ORCHESTRATION · LEAVE</p>
              <h2 className="text-xl font-bold md:text-2xl">إدارة الإجازات الذكية ونسيق المصنع</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                تنسيق مباشر بين الورديات، التخطيط التشغيلي، الحضور، والرواتب — منصّة توزيع قوى عمل وليست استمارة طلب ورقي.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={"/ar/production" as Route}>تخطيط الإنتاج</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={"/ar/monitoring" as Route}>مراقبة القاعات</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      <LeaveOverviewStrip intel={leaveIntel} dashboard={dashboard} />

      <div className="grid gap-6 xl:grid-cols-2">
        <LeaveTypesMatrix />
        <SmartRequestWorkflow
          reqType={reqType}
          setReqType={setReqType}
          reqHall={reqHall}
          setReqHall={setReqHall}
          reqShift={reqShift}
          setReqShift={setReqShift}
          reqDays={reqDays}
          setReqDays={setReqDays}
          reqEmergency={reqEmergency}
          setReqEmergency={setReqEmergency}
          reqReason={reqReason}
          setReqReason={setReqReason}
          smartWarnings={smartWarnings}
          replacements={replacements}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ApprovalWorkflowPanel pending={leaveIntel.pendingApprovals} />
        <PayrollLeaveBridge fin={fin} leaveIntel={leaveIntel} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <LeaveCalendarPlanner
          calView={calView}
          setCalView={setCalView}
          calendarGrid={leaveIntel.calendarGrid}
          holidays={leaveIntel.publicHolidays}
        />
        <WorkforceCoverageHeatmap matrix={leaveIntel.coverageMatrix} halls={leaveIntel.halls} shifts={leaveIntel.shifts} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EmployeeLeaveBalances balances={filteredBalances} searchEmp={searchEmp} setSearchEmp={setSearchEmp} />
        <FactoryOpsIntegration hints={leaveIntel.opsHints} machines={dashboard.machines} />
      </div>

      <LeaveAnalyticsCharts
        leaveTrend={leaveIntel.leaveTrend}
        deptRates={leaveIntel.deptLeaveRates}
        overtimeFromAbsence={leaveIntel.overtimeFromAbsence}
      />

      <SmartLeaveAlerts extra={extraAlerts} />
    </section>
  );
}

type LeaveIntel = ReturnType<typeof buildLeaveIntel>;

function buildLeaveIntel(employees: OpsEmployee[], dashboard: LiveDashboard) {
  const laborProxyDaily = Math.round(12400 + dashboard.kpis.producedPiecesToday * 0.08);
  const shifts = ["صباحي", "مسائي", "ليلي"] as const;
  const halls = ["قاعة الحقن", "قاعة النفخ", "التغليف", "المستودع", "الصيانة"] as const;

  const onLeaveNow = employees.filter((e) => e.attendance === "leave");
  const upcoming = employees
    .filter((e) => seed(e.id + "up", 4) === 0)
    .slice(0, 4)
    .map((e) => ({
      name: e.name,
      from: "12 مايو",
      to: "18 مايو",
      type: "سنوية",
      hall: e.hall
    }));

  const pendingApprovals = employees.slice(0, 5).map((e, i) => ({
    id: `req-${e.id}`,
    employee: e.name,
    type: ["سنوية", "مرضية", "طارئة", "تعويض وردية", "تدريب"][i % 5],
    days: 2 + (i % 4),
    step: (["مشرف", "موارد بشرية", "إدارة المصنع", "مكتمل", "مشرف"] as const)[i % 5],
    impact: i % 3 === 0 ? "حرج" : i % 3 === 1 ? "متوسط" : "منخفض",
    submitted: `${8 + i}:30`
  }));

  const deptShortage = DEPT_NAMES.map((d) => {
    const n = employees.filter((e) => e.department === d && e.attendance !== "leave").length;
    const need = Math.max(2, Math.ceil(employees.filter((e) => e.department === d).length * 0.65));
    return { dept: d, gap: Math.max(0, need - n) };
  }).sort((a, b) => b.gap - a.gap)[0];

  const totalBal = employees.reduce((s, e) => s + (18 + seed(e.id + "bal", 10)), 0);
  const usedYtd = employees.reduce((s, e) => s + seed(e.id + "used", 12), 0);

  const coverageMatrix = halls.map((hall) =>
    shifts.map((sh) => {
      const relevant = employees.filter((e) => (e.hall === hall || e.department === "الصيانة") && e.shift === sh);
      const cap = Math.max(3, relevant.length + 2);
      const avail = relevant.filter((e) => e.attendance === "present").length + seed(`${hall}-${sh}`, 2);
      const pct = Math.round((avail / cap) * 100);
      return { hall, shift: sh, pct, avail, cap };
    })
  ).flat();

  const calendarGrid = Array.from({ length: 28 }, (_, i) => {
    const day = i + 1;
    const leavesHere = seed(`day-${day}`, 4);
    const load = dashboard.productionTrend[Math.min(dashboard.productionTrend.length - 1, Math.floor(i / 7))]?.produced ?? 0;
    return { day, leaves: leavesHere, prodLoad: Math.round(load / 1000) };
  });

  const publicHolidays = [
    { d: "15 مايو", name: "عيد العمل الوطني" },
    { d: "27 رمضان", name: "إجازة نصف الدوام مصنع" },
    { d: "28 مايو", name: "يوم جودة المصنع" }
  ];

  const balances = employees.map((e) => ({
    id: e.id,
    name: e.name,
    annualRem: 8 + seed(e.id, 8),
    used: seed(e.id + "u", 14),
    carry: seed(e.id + "c", 5),
    upcoming: seed(e.id + "up", 3) === 0 ? `+${seed(e.id, 5)} أيام مخططة` : "—"
  }));

  const leaveTrend = ["يناير", "فبراير", "مارس", "أبريل", "مايو"].map((m, i) => ({
    m,
    days: Math.round(12 + seed(m, 20) + i * 3),
    costK: Math.round((laborProxyDaily / 26) * (0.08 + seed(m + "c", 8) / 100))
  }));

  const deptLeaveRates = DEPT_NAMES.map((d) => ({
    dept: d,
    rate: Math.round(8 + seed(d, 15) + (d === "الإنتاج" ? 6 : 0))
  }));

  const overtimeFromAbsence = shifts.map((sh) => ({
    shift: sh,
    hours: Math.round(18 + seed(sh + "ot", 40) + (sh === "ليلي" ? 12 : 0))
  }));

  const opsHints = [
    `ماكينات بتشغيل ${dashboard.kpis.machineUtilization}% — تجنّب مجموعات إجازة في قاعة الحقن نفس اليوم.`,
    `${onLeaveNow.length} موظف في وضع إجازة اليوم؛ ربط بعناوين MES نشطة.`,
    dashboard.kpis.lowStockItems > 0
      ? `مخاطر خام (${dashboard.kpis.lowStockItems} بنود) — لا تُقلل فريق مستودع دون بديل.`
      : "مخزون ضمن خط المتابعة المعتاد."
  ];

  return {
    onLeaveNow,
    upcoming,
    pendingApprovals,
    shortageDept: deptShortage.gap > 0 ? deptShortage.dept : null,
    shortageGap: deptShortage.gap,
    balStats: {
      pool: Math.round(totalBal / employees.length),
      usedYtd,
      pendingN: pendingApprovals.filter((p) => p.step !== "مكتمل").length
    },
    coveragePct: Math.round(
      ((employees.filter((e) => e.attendance !== "absent").length / Math.max(1, employees.length)) * 100)
    ),
    halls: [...halls],
    shifts: [...shifts],
    coverageMatrix,
    calendarGrid,
    publicHolidays,
    balances,
    leaveTrend,
    deptLeaveRates,
    overtimeFromAbsence,
    opsHints
  };
}

const DEPT_NAMES = ["الإنتاج", "الصيانة", "المستودعات", "الجودة", "المحاسبة"] as const;

function analyzeRequest({
  reqType,
  reqHall,
  reqShift,
  reqDays,
  reqEmergency,
  dashboard,
  employees,
  leaveIntel
}: {
  reqType: string;
  reqHall: string;
  reqShift: string;
  reqDays: number;
  reqEmergency: boolean;
  dashboard: LiveDashboard;
  employees: OpsEmployee[];
  leaveIntel: LeaveIntel;
}) {
  const w: Array<{ level: "info" | "warn" | "crit"; text: string }> = [];
  const injStaff = employees.filter((e) => e.hall === "قاعة الحقن" || e.hall.includes("حقن"));
  const onLeaveInj = injStaff.filter((e) => e.attendance === "leave").length;
  if (reqHall.includes("حقن") && onLeaveInj + reqDays > 2) {
    w.push({ level: "crit", text: "قاعة الحقن ستكون تحت حد التشغيل الآمن خلال التواريخ المطلوبة." });
  }
  if (reqShift === "ليلي" && seed("nightcov", 10) > 5) {
    w.push({ level: "warn", text: "كشف مخاطر تغطية — الوردية الليلية: بدائل محدودة في نفس القاعة." });
  }
  if (dashboard.kpis.machineUtilization > 80 && reqDays > 2 && !reqEmergency) {
    w.push({ level: "warn", text: "أسبوع إنتاج مرتفع — تعارض مع حمولة الخطط التشغيلية." });
  }
  if (leaveIntel.pendingApprovals.length > 3 && !reqEmergency) {
    w.push({ level: "info", text: "طلبات معلقة أخرى في نفس الدورة — سيُحتسب تأثير إجمالي على التغطية." });
  }
  const sameHallLeaves = employees.filter((e) => e.hall === reqHall && e.attendance === "leave").length;
  if (sameHallLeaves >= 2) {
    w.push({ level: "warn", text: `يوجد ${sameHallLeaves} موظفون على إجازة في نفس المنطقة — مراجعة الاستبدال.` });
  }
  if (reqType === "sick" && reqDays > 5) {
    w.push({ level: "info", text: "إجازة مرضية طويلة — مطلوب توثيق إضافي وتعديل تصريح تشغيل الماكينة." });
  }
  if (reqEmergency) {
    w.push({ level: "info", text: "مسار طارئ: إشعار فوري للمشرف + تخطيط استبدال في أقل من ٤ ساعات." });
  }
  return w.slice(0, 6);
}

function suggestReplacements(employees: OpsEmployee[], hall: string, shift: string) {
  return employees
    .filter((e) => e.attendance === "present" && e.shift === shift && (e.hall === hall || e.department === "الصيانة"))
    .slice(0, 4)
    .map((e) => ({ ...e, score: Math.round(e.reliability * 0.6 + e.productionEff * 0.4) }))
    .sort((a, b) => b.score - a.score);
}

function LeaveOverviewStrip({ intel, dashboard }: { intel: LeaveIntel; dashboard: LiveDashboard }) {
  return (
    <Card className="erp-card border-primary/25">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <CalendarRange className="h-5 w-5 text-primary" />
          لوحة لمحة الإجازات وتأثير التشغيل
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          ارتباط مباشر بالورديات وحضور اليوم ومؤشرات MES · تذاكر صيانة: {dashboard.kpis.openMaintenanceTickets}
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStatLeave label="على إجازة الآن" value={intel.onLeaveNow.length.toString()} tone="text-violet-600 dark:text-violet-400" sub="مزامنة حضور" />
        <MiniStatLeave label="إجازات قادمة" value={intel.upcoming.length.toString()} tone="text-sky-600 dark:text-sky-400" sub="٢ أسبوع" />
        <MiniStatLeave label="طلبات معلقة" value={intel.balStats.pendingN.toString()} tone="text-amber-600 dark:text-amber-400" sub="سلسلة موافقات" />
        <MiniStatLeave
          label="نقص أقسام"
          value={intel.shortageDept ?? "لا يوجد"}
          tone={intel.shortageDept ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}
          sub={intel.shortageGap ? `فجوة ~${intel.shortageGap}` : "ضمن السعة"}
        />
        <MiniStatLeave
          label="تغطية قوى عمل"
          value={`${intel.coveragePct}%`}
          tone="text-primary"
          sub="حي — مرتبط بالحضور"
        />
        <MiniStatLeave label="متوسط رصيد سنوي" value={`${intel.balStats.pool} يوم`} tone="text-muted-foreground" sub="تقدير للفريق" />
        <MiniStatLeave label="أيام مستخدمة YTD" value={intel.balStats.usedYtd.toString()} tone="text-foreground" sub="تراكمي" />
        <MiniStatLeave
          label="تأثير وردية"
          value={intel.coverageMatrix.filter((c) => c.pct < 62).length ? "خطر" : "مستقر"}
          tone={intel.coverageMatrix.some((c) => c.pct < 55) ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}
          sub="خلايا حرجة في الخريطة"
        />
        <MiniStatLeave
          label="تأثير إنتاج"
          value={dashboard.kpis.machineUtilization > 80 ? "مرتفع" : "معتدل"}
          tone={dashboard.kpis.machineUtilization > 80 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}
          sub={`استخدام ماكينات ${dashboard.kpis.machineUtilization}%`}
        />
        <MiniStatLeave
          label="تنبيهات حرجة"
          value={intel.coverageMatrix.filter((c) => c.pct < 50).length.toString()}
          tone="text-rose-600 dark:text-rose-400"
          sub="قاعات/ورديات"
        />
      </CardContent>
    </Card>
  );
}

function MiniStatLeave({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 dark:bg-muted/15">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function LeaveTypesMatrix() {
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers2 className="h-5 w-5 text-primary" />
          أنواع الإجازات — قواعد ورواتب وقيود
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[420px] space-y-3 overflow-y-auto">
        {LEAVE_TYPE_CATALOG.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.key} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <span className="font-semibold">{t.name}</span>
              </div>
              <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground md:grid-cols-2">
                <p>
                  <span className="text-foreground">موافقات:</span> {t.approval}
                </p>
                <p>
                  <span className="text-foreground">الراتب:</span> {t.payroll}
                </p>
                <p>
                  <span className="text-foreground">مستندات:</span> {t.docs}
                </p>
                <p>
                  <span className="text-foreground">قيود:</span> {t.restrict}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SmartRequestWorkflow({
  reqType,
  setReqType,
  reqHall,
  setReqHall,
  reqShift,
  setReqShift,
  reqDays,
  setReqDays,
  reqEmergency,
  setReqEmergency,
  reqReason,
  setReqReason,
  smartWarnings,
  replacements
}: {
  reqType: string;
  setReqType: (v: string) => void;
  reqHall: string;
  setReqHall: (v: string) => void;
  reqShift: string;
  setReqShift: (v: string) => void;
  reqDays: number;
  setReqDays: (v: number) => void;
  reqEmergency: boolean;
  setReqEmergency: (v: boolean) => void;
  reqReason: string;
  setReqReason: (v: string) => void;
  smartWarnings: Array<{ level: string; text: string }>;
  replacements: ReturnType<typeof suggestReplacements>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-violet-500" />
          طلب إجازة — تحليل تشغيلي فوري
        </CardTitle>
        <p className="text-xs text-muted-foreground">يحلّل التغطية، الاستبدال، حمولة الإنتاج، والإجازات المتراكمة.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-muted-foreground">
            نوع الإجازة
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={reqType}
              onChange={(e) => setReqType(e.target.value)}
            >
              {LEAVE_TYPE_CATALOG.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            مدة (أيام)
            <input
              type="number"
              min={1}
              max={30}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={reqDays}
              onChange={(e) => setReqDays(Number(e.target.value) || 1)}
            />
          </label>
          <label className="text-xs text-muted-foreground">
            القاعة
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={reqHall}
              onChange={(e) => setReqHall(e.target.value)}
            >
              {["قاعة الحقن", "قاعة النفخ", "التغليف", "المستودع", "الصيانة"].map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            الوردية
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={reqShift}
              onChange={(e) => setReqShift(e.target.value)}
            >
              {["صباحي", "مسائي", "ليلي"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs text-muted-foreground">
          السبب
          <textarea
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            rows={2}
            value={reqReason}
            onChange={(e) => setReqReason(e.target.value)}
            placeholder="اكتب السبب التشغيلي أو الشخصي..."
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={reqEmergency} onChange={(e) => setReqEmergency(e.target.checked)} className="rounded border-border" />
          حالة طارئة — تفعيل مسار تصعيد سريع
        </label>
        <div className="rounded-xl border border-dashed border-primary/35 bg-primary/5 p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
            <Cpu className="h-4 w-4" />
            تحذيرات ذكاء التنسيق (AI-style)
          </p>
          <ul className="space-y-2 text-xs">
            {smartWarnings.map((w, i) => (
              <li
                key={i}
                className={`flex gap-2 rounded-lg border px-2 py-1.5 ${
                  w.level === "crit"
                    ? "border-destructive/40 bg-destructive/10"
                    : w.level === "warn"
                      ? "border-amber-500/35 bg-amber-500/10"
                      : "border-border bg-muted/40"
                }`}
              >
                <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{w.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <UserPlus className="h-4 w-4 text-primary" />
            بدائل مقترحة (متاحون + مطابقة وردية/قاعة)
          </p>
          <div className="flex flex-wrap gap-2">
            {replacements.length === 0 ? (
              <span className="text-xs text-destructive">لا يوجد بديل مباشر — جارٍ البحث في فرق الصيانة المشتركة.</span>
            ) : (
              replacements.map((r) => (
                <Badge key={r.id} variant="outline" className="gap-1">
                  {r.name}
                  <span className="text-[10px] opacity-70">↓{r.score}</span>
                </Badge>
              ))
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm">
            <FileText className="ml-1 h-4 w-4" />
            إرفاق مستند
          </Button>
          <Button type="button" variant="secondary" size="sm">
            إرسال للتحليل والموافقة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ApprovalWorkflowPanel({
  pending
}: {
  pending: Array<{ id: string; employee: string; type: string; days: number; step: string; impact: string; submitted: string }>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Workflow className="h-5 w-5 text-primary" />
          مسار الموافقات متعدد المستويات
        </CardTitle>
        <p className="text-xs text-muted-foreground">مشرف → موارد بشرية → إدارة المصنع (عند الحرج) · تصعيد تلقائي عند التأخير.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-muted/25 p-3 dark:bg-muted/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{p.employee}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.type} · {p.days} أيام · أُرسل {p.submitted}
                </p>
              </div>
              <Badge variant={p.impact === "حرج" ? "destructive" : "secondary"}>{p.impact}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              <GitBranch className="h-3.5 w-3.5" />
              <span>المرحلة الحالية:</span>
              <Badge variant="outline">{p.step}</Badge>
              {p.step !== "مكتمل" ? (
                <span className="text-amber-600 dark:text-amber-400">تصعيد خلال 24س إن لم تُعالَج</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">مكتمل</span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PayrollLeaveBridge({ fin, leaveIntel }: { fin: FinanceSnap; leaveIntel: LeaveIntel }) {
  const paidLeaveCost = Math.round(fin.laborDaily * 0.12);
  const unpaidDed = Math.round(fin.laborDaily * 0.04);
  const sickComp = Math.round(fin.laborDaily * 0.03);
  const replOt = leaveIntel.overtimeFromAbsence.reduce((s, x) => s + x.hours, 0) * 45;
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5 text-primary" />
          ربط الرواتب بالإجازات
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {[
          ["إجازات مدفوعة (تقدير يومي)", `${paidLeaveCost.toLocaleString("ar")} ر.س`],
          ["خصومات غير مدفوعة", `−${unpaidDed.toLocaleString("ar")} ر.س`],
          ["تعويض مرضي (سياسة)", `${sickComp.toLocaleString("ar")} ر.س`],
          ["تكلفة إضافي استبدال", `${replOt.toLocaleString("ar")} ر.س`],
          ["مسير شهري مرجعي", `${fin.payrollMonth.toLocaleString("ar")} ر.س`],
          ["هدر تشغيلي مرتبط بالغياب", `~${Math.round((fin.wasteRate / 10) * fin.laborDaily * 0.02).toLocaleString("ar")} ر.س`]
        ].map(([k, v]) => (
          <div key={String(k)} className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">{k}</p>
            <p className="mt-1 font-mono font-bold">{v}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LeaveCalendarPlanner({
  calView,
  setCalView,
  calendarGrid,
  holidays
}: {
  calView: CalView;
  setCalView: (v: CalView) => void;
  calendarGrid: Array<{ day: number; leaves: number; prodLoad: number }>;
  holidays: Array<{ d: string; name: string }>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-5 w-5 text-primary" />
          تقويم القوى العاملة والورديات
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {(["daily", "weekly", "monthly", "shift"] as CalView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setCalView(v)}
              className={`rounded-full border px-3 py-1 text-xs ${calView === v ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground"}`}
            >
              {v === "daily" ? "يومي" : v === "weekly" ? "أسبوعي" : v === "monthly" ? "شهري" : "حسب وردية"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-[11px] text-muted-foreground">
          العرض النشط: <span className="font-semibold text-foreground">{calView === "shift" ? "تجميع حسب الورديات" : calView}</span> — خلايا
          تشير لكثافة إجازات مقابل حمولة إنتاج تقديرية.
        </p>
        <div className="grid grid-cols-7 gap-2 text-center text-[10px]">
          {["س", "ح", "ث", "ر", "خ", "ج", "سب"].map((d) => (
            <div key={d} className="font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
          {calendarGrid.map((cell) => (
            <motion.div
              key={cell.day}
              whileHover={{ scale: 1.03 }}
              className="aspect-square rounded-xl border border-border p-1"
              style={{
                background: `color-mix(in srgb, hsl(var(--primary)) ${Math.min(85, cell.leaves * 22)}%, hsl(var(--card)))`
              }}
            >
              <p className="font-mono font-bold">{cell.day}</p>
              <p className="text-[9px] text-muted-foreground">إج:{cell.leaves}</p>
              <p className="text-[9px] opacity-80">حم:{cell.prodLoad}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <p className="text-xs font-semibold">عطلات رسمية ومزامنة المصنع</p>
          {holidays.map((h) => (
            <div key={h.d} className="flex justify-between rounded-lg bg-muted/30 px-2 py-1 text-[11px] dark:bg-muted/15">
              <span>{h.name}</span>
              <span className="font-mono text-muted-foreground">{h.d}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkforceCoverageHeatmap({
  matrix,
  halls,
  shifts
}: {
  matrix: Array<{ hall: string; shift: string; pct: number; avail: number; cap: number }>;
  halls: string[];
  shifts: string[];
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          خريطة تغطية القاعات (حراري)
        </CardTitle>
        <p className="text-xs text-muted-foreground">نِسَب تغطية مشغّلين — مناطق حرجة ومخاطر إنتاج.</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-center text-[11px]">
            <thead>
              <tr>
                <th className="p-2">قاعة / وردية</th>
                {shifts.map((s) => (
                  <th key={s} className="p-2">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {halls.map((h) => (
                <tr key={h} className="border-t border-border">
                  <td className="p-2 font-semibold">{h}</td>
                  {shifts.map((s) => {
                    const cell = matrix.find((m) => m.hall === h && m.shift === s);
                    const pct = cell?.pct ?? 0;
                    return (
                      <td key={s} className="p-2">
                        <div
                          className="mx-auto rounded-lg border border-border px-2 py-3 font-mono font-bold"
                          style={{
                            background: `color-mix(in srgb, ${pct >= 72 ? "#22c55e" : pct >= 55 ? "#f59e0b" : "#ef4444"} ${Math.min(pct, 100)}%, hsl(var(--muted)))`
                          }}
                        >
                          {pct}%
                          <p className="text-[9px] font-normal text-foreground/80">
                            {cell?.avail}/{cell?.cap}
                          </p>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> مستقر ≥72%
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> مخاطرة 55–71%
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> حرج &lt;55%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmployeeLeaveBalances({
  balances,
  searchEmp,
  setSearchEmp
}: {
  balances: Array<{ id: string; name: string; annualRem: number; used: number; carry: number; upcoming: string }>;
  searchEmp: string;
  setSearchEmp: (v: string) => void;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">أرصدة الإجازات والسجل</CardTitle>
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute right-2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-48 rounded-lg border border-border bg-background py-1.5 pr-8 text-xs"
            placeholder="بحث اسم..."
            value={searchEmp}
            onChange={(e) => setSearchEmp(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="max-h-[360px] space-y-2 overflow-y-auto">
        {balances.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs dark:bg-muted/10">
            <span className="font-medium">{b.name}</span>
            <span className="text-muted-foreground">متبقي: {b.annualRem} · مستخدم: {b.used}</span>
            <span className="text-muted-foreground">مرحّل: {b.carry}</span>
            <Badge variant="outline">{b.upcoming}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FactoryOpsIntegration({
  hints,
  machines
}: {
  hints: string[];
  machines: LiveDashboard["machines"];
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Factory className="h-5 w-5 shrink-0 text-primary" />
          تكامل العمليات — إنتاج وماكينات وصيانة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {hints.map((h, i) => (
          <div key={i} className="flex gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{h}</span>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-muted/30 p-3 text-[11px] dark:bg-muted/15">
          <p className="font-semibold text-foreground">مشغّلو الماكينات المرتبطون</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {machines.slice(0, 5).map((m) => (
              <li key={m.id}>
                {m.code}: {m.operator ?? "—"} {m.status === "maintenance" ? "(صيانة — لا إجازة تشغيل)" : ""}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaveAnalyticsCharts({
  leaveTrend,
  deptRates,
  overtimeFromAbsence
}: {
  leaveTrend: Array<{ m: string; days: number; costK: number }>;
  deptRates: Array<{ dept: string; rate: number }>;
  overtimeFromAbsence: Array<{ shift: string; hours: number }>;
}) {
  return (
    <Card className="erp-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5 text-primary" />
          تحليلات الاستقرار والإجازات
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-3">
        <div className="h-52">
          <p className="mb-1 text-[10px] text-muted-foreground">اتجاه أيام الإجازة وتكلفة تقريبية</p>
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={leaveTrend}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <XAxis dataKey="m" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="l" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line yAxisId="l" type="monotone" dataKey="days" name="أيام" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line yAxisId="r" type="monotone" dataKey="costK" name="تكلفة k" stroke="#a855f7" strokeWidth={2} dot />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-52">
          <p className="mb-1 text-[10px] text-muted-foreground">معدل إجازات حسب القسم</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptRates}>
              <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="dept" tick={{ fontSize: 9 }} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="rate" name="%" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="h-52">
          <p className="mb-1 text-[10px] text-muted-foreground">إضافي ناتج عن نواقص/إجازات</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overtimeFromAbsence} layout="vertical">
              <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="shift" type="category" width={48} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="hours" name="ساعات" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SmartLeaveAlerts({ extra }: { extra: Array<{ tag: string; msg: string; tone: "info" | "warn" | "crit" }> }) {
  return (
    <Card className="erp-card border-amber-500/25 bg-gradient-to-l from-amber-500/5 to-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          تنبيهات ذكية — إجازات وتغطية وإنتاج
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {extra.map((a, i) => (
          <div
            key={i}
            className={`rounded-xl border px-3 py-2 text-xs ${
              a.tone === "crit"
                ? "border-destructive/40 bg-destructive/10"
                : a.tone === "warn"
                  ? "border-amber-500/35 bg-amber-500/10"
                  : "border-border bg-muted/30"
            }`}
          >
            <Badge variant="outline" className="mb-1 text-[9px]">
              {a.tag}
            </Badge>
            <p>{a.msg}</p>
          </div>
        ))}
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3 text-xs dark:bg-violet-950/20">
          <p className="font-semibold text-violet-800 dark:text-violet-200">نمط إجازات مرضية متكرر</p>
          <p className="mt-1 text-muted-foreground">يُنصح بمراجعة جدول وردية قاعة النفخ — كشف أنماط تلقائي.</p>
        </div>
        <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 text-xs dark:bg-sky-950/20">
          <p className="font-semibold text-sky-800 dark:text-sky-200">مخاطر عطلة قادمة</p>
          <p className="mt-1 text-muted-foreground">تغطية المستودع دون مشرف احتياطي — بطاقة مهام لمخطط الإنتاج.</p>
        </div>
      </CardContent>
    </Card>
  );
}
