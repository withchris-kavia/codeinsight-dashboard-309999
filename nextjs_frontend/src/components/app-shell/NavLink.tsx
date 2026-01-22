"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  label: string;
  icon?: ReactNode;
  onNavigate?: () => void;
};

// PUBLIC_INTERFACE
export default function NavLink({ href, label, icon, onNavigate }: NavLinkProps) {
  /** Navigation link used inside the sidebar; highlights the active route. */
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
        isActive
          ? "bg-[color:var(--accent-weak)] text-[color:var(--accent)]"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
      ].join(" ")}
      aria-current={isActive ? "page" : undefined}
    >
      <span
        className={[
          "grid h-8 w-8 place-items-center rounded-md border transition",
          isActive
            ? "border-blue-200 bg-white text-[color:var(--accent)]"
            : "border-slate-200 bg-white text-slate-600 group-hover:text-slate-800",
        ].join(" ")}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
