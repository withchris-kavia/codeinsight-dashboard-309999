"use client";

import type { ReactNode } from "react";
import NavLink from "./NavLink";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

function Icon({ children }: { children: ReactNode }) {
  return <span className="h-4 w-4">{children}</span>;
}

function DashboardIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M4 13.5V20a1 1 0 0 0 1 1h5v-7.5H4Zm10 7.5h5a1 1 0 0 0 1-1v-10h-6v11Zm-4 0h4V3H7a1 1 0 0 0-1 1v9.5h4Zm10-13h-6V3h5a1 1 0 0 1 1 1v4Z"
          fill="currentColor"
        />
      </svg>
    </Icon>
  );
}

function RepoIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M4 6a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm10-1v5h5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  );
}

function TrophyIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M8 4h8v3a4 4 0 0 1-8 0V4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M6 7H4a2 2 0 0 0 2 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M18 7h2a2 2 0 0 1-2 2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10 15h4v2a2 2 0 0 0 2 2H8a2 2 0 0 0 2-2v-2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  );
}

function AdminIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M12 2 20 6v6c0 5-3.5 9.4-8 10-4.5-.6-8-5-8-10V6l8-4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 12.5 11 14l3.5-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  );
}

function SettingsIcon() {
  return (
    <Icon>
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.3.7a7.7 7.7 0 0 0-1.7-1L15 4h-6l-.5 2.7a7.7 7.7 0 0 0-1.7 1L4.5 7.9l-2 3.5L4.5 13a8 8 0 0 0 .1 2l-2 1.5 2 3.5 2.3-.7a7.7 7.7 0 0 0 1.7 1L9 22h6l.5-2.7a7.7 7.7 0 0 0 1.7-1l2.3.7 2-3.5L19.4 15Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </Icon>
  );
}

// PUBLIC_INTERFACE
export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  /** Sidebar navigation; renders as a fixed desktop sidebar and an off-canvas panel on mobile. */
  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-40 w-72 border-r bg-white",
        "transition-transform duration-200 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
      aria-label="Primary navigation"
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-sm">
            <span className="text-sm font-semibold">CI</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">CodeInsight</div>
            <div className="text-xs text-slate-500">Git analytics</div>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <nav className="px-3 pb-6">
        <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Navigation
        </div>

        <div className="space-y-1">
          <NavLink href="/" label="Dashboard" icon={<DashboardIcon />} onNavigate={onClose} />
          <NavLink href="/repos" label="Repositories" icon={<RepoIcon />} onNavigate={onClose} />
          <NavLink
            href="/leaderboard"
            label="Leaderboard"
            icon={<TrophyIcon />}
            onNavigate={onClose}
          />
          <NavLink href="/admin" label="Admin" icon={<AdminIcon />} onNavigate={onClose} />
          <NavLink href="/settings" label="Settings" icon={<SettingsIcon />} onNavigate={onClose} />
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
          <div className="text-sm font-semibold text-slate-900">Tip</div>
          <div className="mt-1 text-xs leading-relaxed text-slate-600">
            Connect repos and track commits, PRs, and developer activity in real-time.
          </div>
        </div>
      </nav>
    </aside>
  );
}
