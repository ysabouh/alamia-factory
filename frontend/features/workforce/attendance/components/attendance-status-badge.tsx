"use client";

import { WfmStatusBadge, type WfmBadgeTone } from "@/components/workforce/atlas";
import { AttendanceStatusIcon } from "@/features/workforce/employee-management/employee-registry-icons";
import type { AttendanceStatus } from "@/lib/api/workforce-attendance-client";

const labels: Record<AttendanceStatus, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  leave: "إجازة",
  paid_leave: "إجازة مدفوعة",
  unpaid_leave: "إجازة غير مدفوعة",
  holiday: "عطلة",
  weekend: "عطلة أسبوعية",
  remote: "عن بُعد",
  mission: "مهمة"
};

function tone(s: AttendanceStatus): WfmBadgeTone {
  if (s === "present" || s === "remote" || s === "mission") return "active";
  if (s === "late") return "warning";
  if (s === "absent") return "danger";
  if (s === "paid_leave" || s === "unpaid_leave") return "info";
  return "info";
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <WfmStatusBadge tone={tone(status)} className="gap-1.5">
      <AttendanceStatusIcon
        state={
          status === "holiday" ||
          status === "weekend" ||
          status === "mission" ||
          status === "paid_leave" ||
          status === "unpaid_leave" ||
          status === "leave"
            ? "leave"
            : status === "remote"
              ? "present"
              : status
        }
      />
      {labels[status]}
    </WfmStatusBadge>
  );
}
