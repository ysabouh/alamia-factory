import { RequireAuthGate } from "@/components/auth/require-auth-gate";
import { AppShell } from "@/components/factory/app-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuthGate>
      <AppShell>{children}</AppShell>
    </RequireAuthGate>
  );
}
