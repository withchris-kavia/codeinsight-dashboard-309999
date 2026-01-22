"use client";

import { useCallback, useEffect, useState } from "react";
import { clearOrgId, getOrgId, setOrgId } from "@/lib/orgState";

function isUuidLike(value: string): boolean {
  // Lightweight check (enough for UX). Backend will validate strictly.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// PUBLIC_INTERFACE
export default function OrgIdPrompt({
  onOrgIdChange,
}: {
  /** UI control to set required org_id for analytics endpoints (stored in localStorage). */
  onOrgIdChange?: (orgId: string) => void;
}) {
  const [orgId, setOrgIdValue] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const current = getOrgId();
    setOrgIdValue(current);
  }, []);

  const save = useCallback(() => {
    setTouched(true);
    if (!orgId || !isUuidLike(orgId)) return;
    setOrgId(orgId);
    onOrgIdChange?.(orgId);
  }, [onOrgIdChange, orgId]);

  const clear = useCallback(() => {
    clearOrgId();
    setOrgIdValue("");
    onOrgIdChange?.("");
  }, [onOrgIdChange]);

  const invalid = touched && orgId.length > 0 && !isUuidLike(orgId);

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Organization</div>
          <div className="mt-1 text-xs text-slate-600">
            This backend API requires an <code className="rounded bg-white px-1 py-0.5">org_id</code> UUID. Paste it
            below to load analytics.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            Save
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-medium text-slate-600" htmlFor="orgId">
          org_id (UUID)
        </label>
        <input
          id="orgId"
          value={orgId}
          onChange={(e) => setOrgIdValue(e.target.value.trim())}
          onBlur={() => setTouched(true)}
          placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
          className={[
            "mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/30",
            invalid ? "border-rose-300" : "border-slate-200",
          ].join(" ")}
        />
        {invalid ? <div className="mt-1 text-xs text-rose-700">Please enter a valid UUID.</div> : null}
      </div>

      <div className="mt-3 text-[11px] text-slate-600">
        Tip: If you’re running seed data/webhooks, the backend creates a default org internally. If you don’t know the
        org_id yet, you may need to query the database <code className="rounded bg-white px-1 py-0.5">orgs</code> table.
      </div>
    </section>
  );
}
