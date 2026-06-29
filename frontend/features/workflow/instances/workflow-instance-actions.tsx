"use client";

import { useRef, useState } from "react";

import { useFactoryAuth } from "@/contexts/factory-auth-context";
import { workflowApi, type WorkflowInstanceJson, type WorkflowTaskJson } from "@/lib/api/workflow-client";

const ACTIVE_STATUSES = new Set(["assigned", "pending", "accepted", "in_progress", "waiting_information"]);

type Props = {
  instance: WorkflowInstanceJson;
  activeTask: WorkflowTaskJson | null;
  onRefresh: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
  setError: (v: string | null) => void;
};

export function WorkflowInstanceActions({
  instance,
  activeTask,
  onRefresh,
  busy,
  setBusy,
  setError
}: Props) {
  const { user, can } = useFactoryAuth();
  const canManage = can("workflow.instances.manage");
  const fileRef = useRef<HTMLInputElement>(null);
  const [returnReason, setReturnReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const employeeId = user?.employeeId ? Number(user.employeeId) : null;
  const isAssignee = activeTask?.assignedTo != null && employeeId === activeTask.assignedTo;
  const canAct = isAssignee && activeTask != null && ACTIVE_STATUSES.has(activeTask.status);
  const stageRequiresApproval =
    activeTask?.stage?.requiresApproval ?? instance.currentStage?.requiresApproval ?? false;
  const showApprove =
    canManage &&
    instance.status === "waiting_approval" &&
    stageRequiresApproval &&
    activeTask?.status === "completed";
  const gatewayDecision = instance.gatewayDecision;
  const showGatewayDecision =
    gatewayDecision != null &&
    activeTask?.id === gatewayDecision.taskId &&
    activeTask.status === "completed" &&
    (isAssignee || canManage);
  const canReturn =
    canManage &&
    instance.currentStage?.allowReturn &&
    !["completed", "rejected", "cancelled"].includes(instance.status);
  const canReject = canAct && activeTask?.stage?.allowRejection;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = () => {
    if (!activeTask) return;
    const checklist = (activeTask.checklist ?? []).map((c) => ({
      checklistItemId: c.checklistItemId,
      isCompleted: c.isCompleted
    }));
    void run(() => workflowApi.completeTask(activeTask.id, { checklist }));
  };

  const handleUpload = async (file: File) => {
    if (!activeTask) return;
    setBusy(true);
    setError(null);
    try {
      await workflowApi.uploadAttachment(activeTask.id, file);
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفع");
    } finally {
      setBusy(false);
    }
  };

  if (!activeTask && !canReturn && !showApprove && !showGatewayDecision) {
    return null;
  }

  const waitingManagerApproval = instance.status === "waiting_approval" && stageRequiresApproval;

  return (
    <div className="border-t border-atlas-border p-4 dark:border-zinc-700">
      {waitingManagerApproval && canManage && showApprove ? (
        <p className="mb-2 rounded-md bg-violet-50 px-3 py-2 text-xs text-violet-900 dark:bg-violet-950/40 dark:text-violet-100">
          أنهى المنفّذ المهمة. اضغط «اعتماد» لإغلاق سير العمل — وليس «إكمال».
        </p>
      ) : null}
      {waitingManagerApproval && !canManage ? (
        <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          المهمة مكتملة وبانتظار اعتماد المدير لإغلاق السير.
        </p>
      ) : null}
      {showGatewayDecision ? (
        <p className="mb-2 text-xs text-atlas-muted">اختر المسار التالي:</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {showGatewayDecision
          ? gatewayDecision!.options.map((opt) => (
              <button
                key={opt.condition}
                type="button"
                disabled={busy}
                className={
                  opt.condition === "on_reject"
                    ? "atlas-btn-secondary text-xs"
                    : "atlas-btn-primary text-xs"
                }
                title={opt.targetStageName ? `→ ${opt.targetStageName}` : undefined}
                onClick={() =>
                  void run(() =>
                    workflowApi.chooseGatewayPath(activeTask!.id, opt.condition as "on_approve" | "on_reject")
                  )
                }
              >
                {opt.label}
                {opt.targetStageName ? ` (${opt.targetStageName})` : ""}
              </button>
            ))
          : null}
        {canReturn ? (
          <button
            type="button"
            disabled={busy}
            className="atlas-btn-secondary text-xs"
            onClick={() => setShowReturn((v) => !v)}
          >
            إرجاع
          </button>
        ) : null}
        {canReject ? (
          <button
            type="button"
            disabled={busy}
            className="atlas-btn-secondary text-xs text-red-700"
            onClick={() => setShowReject((v) => !v)}
          >
            رفض
          </button>
        ) : null}
        {showApprove ? (
          <button
            type="button"
            disabled={busy}
            className="atlas-btn-primary text-xs"
            onClick={() => void run(() => workflowApi.approveTask(activeTask!.id))}
          >
            اعتماد
          </button>
        ) : null}
        {canAct && !showApprove && !showGatewayDecision ? (
          <button type="button" disabled={busy} className="atlas-btn-primary text-xs" onClick={handleComplete}>
            إكمال → التالي
          </button>
        ) : null}
        {activeTask && (canAct || canManage) ? (
          <>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={busy}
              className="atlas-btn-secondary text-xs"
              onClick={() => fileRef.current?.click()}
            >
              رفع ملف
            </button>
          </>
        ) : null}
      </div>

      {showReturn ? (
        <div className="mt-3 space-y-2">
          <textarea
            className="atlas-input w-full text-sm"
            rows={2}
            placeholder="سبب الإرجاع..."
            value={returnReason}
            disabled={busy}
            onChange={(e) => setReturnReason(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || !returnReason.trim()}
            className="atlas-btn-secondary text-xs"
            onClick={() =>
              void run(async () => {
                await workflowApi.returnInstance(instance.id, returnReason.trim());
                setReturnReason("");
                setShowReturn(false);
              })
            }
          >
            تأكيد الإرجاع
          </button>
        </div>
      ) : null}

      {showReject ? (
        <div className="mt-3 space-y-2">
          <textarea
            className="atlas-input w-full text-sm"
            rows={2}
            placeholder="سبب الرفض..."
            value={rejectReason}
            disabled={busy}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || !rejectReason.trim()}
            className="atlas-btn-secondary text-xs text-red-700"
            onClick={() =>
              void run(async () => {
                await workflowApi.rejectTask(activeTask!.id, rejectReason.trim());
                setRejectReason("");
                setShowReject(false);
              })
            }
          >
            تأكيد الرفض
          </button>
        </div>
      ) : null}
    </div>
  );
}
