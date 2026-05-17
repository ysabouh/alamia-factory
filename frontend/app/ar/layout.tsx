"use client";

import { FactoryAuthProvider } from "@/contexts/factory-auth-context";

export default function ArLocaleLayout({ children }: { children: React.ReactNode }) {
  return <FactoryAuthProvider>{children}</FactoryAuthProvider>;
}
