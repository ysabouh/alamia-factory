"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AttendanceStatusChart({
  data
}: {
  data: Array<{ name: string; value: number }>;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-atlas-muted">لا توجد بيانات للرسم.</p>;
  }

  return (
    <div className="h-full min-h-[12rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minHeight={192}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#c27803" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
