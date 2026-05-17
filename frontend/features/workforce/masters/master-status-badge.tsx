import { WfmStatusBadge } from "@/components/workforce/atlas";

export function MasterStatusBadge({ active }: { active: boolean }) {
  return <WfmStatusBadge tone={active ? "active" : "neutral"}>{active ? "نشط" : "معطّل"}</WfmStatusBadge>;
}
