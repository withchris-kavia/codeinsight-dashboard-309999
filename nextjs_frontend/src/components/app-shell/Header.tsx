"use client";

type HeaderProps = {
  onOpenSidebar: () => void;
};

// PUBLIC_INTERFACE
export default function Header({ onOpenSidebar }: HeaderProps) {
  /** App top header; provides mobile menu toggle and a placeholder actions area. */
  return (
    <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">CodeInsight Dashboard</div>
          <div className="text-xs text-slate-500">Analytics & AI summaries</div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <div className="relative">
            <input
              type="search"
              placeholder="Search… (placeholder)"
              className="h-10 w-72 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="Search"
            />
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Help
          </button>
        </div>
      </div>
    </header>
  );
}
