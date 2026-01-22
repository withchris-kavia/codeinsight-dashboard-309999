import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold text-slate-900">404 – Page Not Found</h1>
      <p className="text-sm text-slate-600">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
