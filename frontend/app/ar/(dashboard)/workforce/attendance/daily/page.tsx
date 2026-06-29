import { Suspense } from "react";

import { DailyAttendanceWorkspace } from "@/features/workforce/attendance/daily-attendance-workspace";

export default function DailyAttendancePage() {
  return (
    <Suspense
      fallback={
        <p className="rounded-sm border border-atlas-rule bg-atlas-paper p-6 text-sm text-atlas-muted">
          جاري تحميل الحضور…
        </p>
      }
    >
      <DailyAttendanceWorkspace />
    </Suspense>
  );
}
