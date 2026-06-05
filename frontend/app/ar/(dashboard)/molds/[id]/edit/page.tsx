import { redirect } from "next/navigation";
import { MoldFormWorkspace } from "@/features/molds/management/mold-form-workspace";

export default async function EditMoldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    redirect("/ar/molds/registry");
  }

  return <MoldFormWorkspace moldId={id} />;
}
