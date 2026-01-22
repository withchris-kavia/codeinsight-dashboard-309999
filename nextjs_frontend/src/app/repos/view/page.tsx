import { Suspense } from "react";
import RepoDetailClient from "./RepoDetailClient";

export default function RepoDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900">Repository</h1>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
            Loading…
          </div>
        </div>
      }
    >
      <RepoDetailClient />
    </Suspense>
  );
}
