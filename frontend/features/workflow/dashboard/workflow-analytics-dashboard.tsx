"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { WorkflowDashboardKpiStrip } from "@/features/workflow/dashboard/workflow-dashboard-kpi-strip";
import { workflowApi, type WorkflowDashboardJson } from "@/lib/api/workflow-client";

export function WorkflowAnalyticsDashboard() {
  const [data, setData] = useState<WorkflowDashboardJson | null>(null);

  useEffect(() => {
    void workflowApi.dashboard().then(setData);
  }, []);

  if (!data) {
    return <p className="p-6 text-atlas-muted">جاري تحميل لوحة التحكم...</p>;
  }

  return (
    <div className="space-y-5 p-4 md:p-6 dark:bg-zinc-950">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-atlas-brand/10 text-atlas-brand">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-atlas-ink dark:text-zinc-100">لوحة سير العمل</h1>
            <p className="text-sm text-atlas-muted">نظرة عامة على التنفيذات والمهام ومؤشرات الأداء</p>
          </div>
        </div>

        <WorkflowDashboardKpiStrip data={data} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900" dir="ltr">
          <h3 className="mb-2 text-sm font-bold text-atlas-ink dark:text-zinc-100" dir="rtl">
            المهام حسب القسم
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.tasksByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#c45c26" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900" dir="ltr">
          <h3 className="mb-2 text-sm font-bold text-atlas-ink dark:text-zinc-100" dir="rtl">
            الاتجاه الشهري
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="started" stroke="#c45c26" name="بدء" />
              <Line type="monotone" dataKey="completed" stroke="#16a34a" name="إكمال" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-atlas-rule bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900" dir="ltr">
        <h3 className="mb-2 text-sm font-bold text-atlas-ink dark:text-zinc-100" dir="rtl">
          اختناقات المراحل (متوسط الدقائق)
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.bottlenecks} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="stage" width={100} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="avgMinutes" fill="#7c3aed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
