"use client";

import { createContext, useContext } from "react";

import type { OrgChartEmployeeNode } from "./org-chart-types";

type OrgChartInteractionContextValue = {
  highlightedId: string | null;
  onEmployeeClick: (employee: OrgChartEmployeeNode) => void;
  onEmployeeContextMenu: (event: React.MouseEvent, employee: OrgChartEmployeeNode) => void;
};

const OrgChartInteractionContext = createContext<OrgChartInteractionContextValue | null>(null);

export function OrgChartInteractionProvider({
  value,
  children
}: {
  value: OrgChartInteractionContextValue;
  children: React.ReactNode;
}) {
  return <OrgChartInteractionContext.Provider value={value}>{children}</OrgChartInteractionContext.Provider>;
}

export function useOrgChartInteraction() {
  return useContext(OrgChartInteractionContext);
}
