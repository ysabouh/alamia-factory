"use client";

import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";

type Props = {
  dep?: string;
};

/** يضبط zoom بعد تحميل العقد — React Flow يحتاج ارتفاعاً صريحاً على الحاوية */
export function WorkflowGraphFitView({ dep }: Props) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      void fitView({ padding: 0.25, duration: 200 });
    });
    return () => window.cancelAnimationFrame(id);
  }, [fitView, dep]);

  return null;
}

export const WORKFLOW_GRAPH_HEIGHT = 400;
