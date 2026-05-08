import { Badge } from "@/components/ui/badge";

type StatusTone = "success" | "warning" | "critical" | "info" | "neutral";

export function StatusBadge({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: StatusTone;
}) {
  if (tone === "success") return <Badge variant="success">{label}</Badge>;
  if (tone === "warning") return <Badge variant="warning">{label}</Badge>;
  if (tone === "critical") return <Badge variant="destructive">{label}</Badge>;
  if (tone === "info") return <Badge variant="info">{label}</Badge>;
  return <Badge variant="secondary">{label}</Badge>;
}
