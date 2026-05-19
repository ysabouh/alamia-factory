"use client";

import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkforceApiError } from "@/lib/api/workforce-client";

import { useEmployeeRegistry } from "./employee-registry-context";
import { ManagedEmployeeEditForm } from "./managed-employee-form";
import { ManagedEmployeeDetail } from "./managed-employee-detail";
import type { ManagedEmployee } from "./model";

function RegistryLoading() {
  return (
    <div className="animate-pulse space-y-4 rounded-sm border border-atlas-rule bg-atlas-paper p-8">
      <div className="flex gap-4">
        <div className="h-28 w-28 shrink-0 rounded-sm bg-atlas-canvas" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-5 w-1/2 rounded bg-atlas-canvas" />
          <div className="h-3 w-1/3 rounded bg-atlas-canvas" />
        </div>
      </div>
      <div className="h-32 rounded-sm bg-atlas-canvas/80" />
    </div>
  );
}

export function EmployeeDetailRouteView({ id }: { id: string }) {
  const { hydrated, fetchEmployeeOne } = useEmployeeRegistry();
  const [employee, setEmployee] = useState<ManagedEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    setFailed(null);
    void fetchEmployeeOne(id)
      .then((e) => {
        if (!cancelled) setEmployee(e);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof WorkforceApiError && err.status === 404) notFound();
        setFailed(err instanceof Error ? err.message : "تعذر التحميل");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, hydrated, fetchEmployeeOne]);

  if (!hydrated || loading) return <RegistryLoading />;
  if (failed) {
    return (
      <div className="rounded-sm border border-atlas-danger/35 bg-atlas-danger/10 p-6 text-sm text-atlas-danger">
        {failed}
      </div>
    );
  }
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2 rounded-sm border border-atlas-rule bg-atlas-paper p-4 shadow-atlasCard">
        <Button variant="atlasOutline" className="rounded-sm gap-2" asChild>
          <Link href={"/ar/workforce/employees" as Route}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            سجل العاملين
          </Link>
        </Button>
        <Button variant="atlasPrimary" className="rounded-sm" asChild>
          <Link href={`/ar/workforce/employees/${encodeURIComponent(employee.id)}/edit` as Route}>تعديل السجل</Link>
        </Button>
      </div>
      <ManagedEmployeeDetail employee={employee} onEmployeePatched={setEmployee} />
    </div>
  );
}

export function EmployeeEditRouteView({ id }: { id: string }) {
  const { hydrated, fetchEmployeeOne } = useEmployeeRegistry();
  const [employee, setEmployee] = useState<ManagedEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setLoading(true);
    setFailed(null);
    void fetchEmployeeOne(id)
      .then((e) => {
        if (!cancelled) setEmployee(e);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof WorkforceApiError && err.status === 404) notFound();
        setFailed(err instanceof Error ? err.message : "تعذر التحميل");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, hydrated, fetchEmployeeOne]);

  if (!hydrated || loading) return <RegistryLoading />;
  if (failed) {
    return (
      <div className="rounded-sm border border-atlas-danger/35 bg-atlas-danger/10 p-6 text-sm text-atlas-danger">{failed}</div>
    );
  }
  if (!employee) notFound();

  return <ManagedEmployeeEditForm employee={employee} onEmployeeUpdated={setEmployee} />;
}
