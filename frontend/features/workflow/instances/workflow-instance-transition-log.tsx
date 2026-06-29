"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronLeft, Clock, History } from "lucide-react";

import {
  buildTasksById,
  enrichTimelineEntry,
  getStageCompletedAt,
  sortStagesByNumber,
  type StageProgress,
  type TimelineEntry
} from "@/features/workflow/instances/workflow-instance-stage-utils";
import {
  formatStageIndex,
  formatStageOfTotal,
  getStageVisualTheme,
  stageStateLabel,
  WorkflowStageStateIcon
} from "@/features/workflow/instances/workflow-stage-visuals";
import { WorkflowTimelineEventCard } from "@/features/workflow/instances/workflow-stage-summary-parts";
import type { WorkflowInstanceJson } from "@/lib/api/workflow-client";

type Props = {
  stages: StageProgress[];
  timeline: TimelineEntry[];
  instance: WorkflowInstanceJson;
  selectedStageId?: number | null;
  onStageSelect?: (stageId: number) => void;
};

export function WorkflowInstanceTransitionLog({
  stages,
  timeline,
  instance,
  selectedStageId,
  onStageSelect
}: Props) {
  const [showAllEvents, setShowAllEvents] = useState(false);
  const orderedStages = useMemo(() => sortStagesByNumber(stages), [stages]);
  const tasksById = useMemo(() => buildTasksById(instance), [instance]);
  const totalStages = orderedStages.length;

  const enrichedTimeline = useMemo(
    () => timeline.map((e) => enrichTimelineEntry(e, tasksById)),
    [timeline, tasksById]
  );

  const completedCount = orderedStages.filter((s) => s.state === "completed").length;
  const progressPercent =
    orderedStages.length > 0 ? Math.round((completedCount / orderedStages.length) * 100) : 0;

  const recentEvents = showAllEvents
    ? [...enrichedTimeline].reverse()
    : [...enrichedTimeline].slice(-12).reverse();

  return (
    <div className="rounded-xl border border-atlas-rule bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-atlas-rule px-4 py-3 dark:border-zinc-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold">سجل الانتقالات</h3>
            <p className="mt-0.5 text-xs text-atlas-muted">
              {completedCount} من {totalStages} مراحل مكتملة
              {onStageSelect ? " · اضغط على أي مرحلة لعرض التفاصيل الكاملة" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
            <span>{progressPercent}%</span>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-blue-100 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto px-4 py-5">
        <div className="flex min-w-max items-start gap-3" role="list" aria-label="مراحل سير العمل">
          {orderedStages.map((s, i) => {
            const completedAt = getStageCompletedAt(timeline, s.name);
            const selected = selectedStageId === s.id;
            const clickable = Boolean(onStageSelect);
            const theme = getStageVisualTheme(s.state);

            return (
              <Fragment key={s.id}>
                {i > 0 ? (
                  <div className="flex w-14 shrink-0 flex-col items-center self-center sm:w-16" aria-hidden>
                    <div
                      className={`h-1 w-full rounded-full bg-gradient-to-l ${getStageVisualTheme(orderedStages[i - 1]!.state).connector}`}
                    />
                    <ChevronLeft className="mt-0.5 h-3.5 w-3.5 text-atlas-muted opacity-60" />
                  </div>
                ) : null}

                <button
                  type="button"
                  role="listitem"
                  disabled={!clickable}
                  onClick={() => onStageSelect?.(s.id)}
                  className={`w-44 shrink-0 overflow-hidden rounded-xl border-2 text-center shadow-sm transition ${
                    theme.border
                  } ${clickable ? "cursor-pointer hover:shadow-md" : "cursor-default"} ${
                    selected ? "ring-2 ring-atlas-brand ring-offset-2 dark:ring-offset-zinc-900" : ""
                  }`}
                >
                  <div className={`flex items-center justify-between px-3 py-1.5 ${theme.headerBg}`}>
                    <span className="text-xs font-bold text-white">{formatStageIndex(s.stageNumber)}</span>
                    <WorkflowStageStateIcon state={s.state} className="h-4 w-4" />
                  </div>

                  <div className={`px-3 py-2.5 ${theme.bodyBg}`}>
                    <p className={`line-clamp-2 text-xs font-bold leading-snug ${theme.title}`}>{s.name}</p>

                    <p className="mt-1.5 text-[10px] font-semibold text-atlas-muted">
                      {formatStageOfTotal(s.stageNumber, totalStages)}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${theme.badge}`}
                    >
                      {stageStateLabel(s.state)}
                    </span>

                    {completedAt ? (
                      <p className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-atlas-muted">
                        <Clock className="h-3 w-3" />
                        {new Date(completedAt).toLocaleDateString("ar")}
                      </p>
                    ) : s.state === "current" ? (
                      <p className="mt-1.5 text-[10px] font-medium text-blue-600">جارية الآن</p>
                    ) : null}
                  </div>
                </button>
              </Fragment>
            );
          })}
        </div>
      </div>

      {enrichedTimeline.length > 0 ? (
        <div className="border-t border-atlas-rule px-4 py-3 dark:border-zinc-700">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold text-atlas-ink">
              <History className="h-3.5 w-3.5 text-atlas-muted" />
              آخر الأحداث
              <span className="font-normal text-atlas-muted">({enrichedTimeline.length})</span>
            </h4>
            {enrichedTimeline.length > 12 ? (
              <button
                type="button"
                onClick={() => setShowAllEvents((v) => !v)}
                className="text-[10px] font-medium text-atlas-brand hover:underline"
              >
                {showAllEvents ? "عرض أقل" : `عرض الكل (${enrichedTimeline.length})`}
              </button>
            ) : null}
          </div>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {recentEvents.map((e) => (
              <WorkflowTimelineEventCard key={e.id} event={e} compact />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
