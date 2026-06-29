"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createDirectTaskSchema,
  defaultCreateDirectTaskValues,
  fromDraftPayload,
  toCreatePayload,
  type CreateDirectTaskFormValues
} from "@/features/direct-tasks/create/create-direct-task-schema";
import { directTasksApi } from "@/lib/api/direct-tasks-client";

export function useCreateDirectTaskForm() {
  const [values, setValues] = useState<CreateDirectTaskFormValues>(defaultCreateDirectTaskValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [draftLoading, setDraftLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await directTasksApi.getDraft();
        if (res.data?.payload) {
          setValues(fromDraftPayload(res.data.payload as Record<string, unknown>));
          setLastSavedAt(res.data.updatedAt ?? null);
        }
      } finally {
        setDraftLoading(false);
      }
    })();
  }, []);

  const patch = useCallback((patchValues: Partial<CreateDirectTaskFormValues>) => {
    setValues((prev) => ({ ...prev, ...patchValues }));
  }, []);

  useEffect(() => {
    if (draftLoading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void directTasksApi
        .saveDraft(toCreatePayload(values))
        .then((res) => setLastSavedAt(res.data?.updatedAt ?? new Date().toISOString()))
        .catch(() => undefined);
    }, 2000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [values, draftLoading]);

  const validate = useCallback(() => {
    const parsed = createDirectTaskSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[issue.path.join(".")] = issue.message;
      }
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  }, [values]);

  const saveDraftNow = useCallback(async () => {
    setSaving(true);
    try {
      const res = await directTasksApi.saveDraft(toCreatePayload(values));
      setLastSavedAt(res.data?.updatedAt ?? new Date().toISOString());
    } finally {
      setSaving(false);
    }
  }, [values]);

  const submit = useCallback(async () => {
    if (!validate()) throw new Error("validation");
    setSaving(true);
    try {
      const payload = toCreatePayload(values, false);
      const task = await directTasksApi.create(payload);
      for (const file of pendingFiles) {
        await directTasksApi.uploadAttachment(task.id, file);
      }
      await directTasksApi.deleteDraft();
      return task;
    } finally {
      setSaving(false);
    }
  }, [pendingFiles, validate, values]);

  const summary = useMemo(() => values, [values]);

  return {
    values,
    patch,
    setValues,
    errors,
    saving,
    draftLoading,
    lastSavedAt,
    pendingFiles,
    setPendingFiles,
    validate,
    saveDraftNow,
    submit,
    summary
  };
}
