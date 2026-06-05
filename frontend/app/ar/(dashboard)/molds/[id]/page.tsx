import { redirect } from "next/navigation";
import { MoldDetailWorkspace } from "@/features/molds/management/mold-detail-workspace";

const RESERVED = new Set(["registry", "new", "edit"]);

export default async function MoldDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (RESERVED.has(id)) {
    redirect("/ar/molds/registry");
  }

  if (!/^\d+$/.test(id)) {
    redirect("/ar/molds/registry");
  }

  return <MoldDetailWorkspace moldId={id} />;
}
