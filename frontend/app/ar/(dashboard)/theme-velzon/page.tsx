import { redirect } from "next/navigation";

/** نسق Velzon Minimal أصبح افتراضيًا في `AppShell` — إعادة توجيه للرئيسية. */
export default function VelzonThemeRedirectPage() {
  redirect("/ar");
}
