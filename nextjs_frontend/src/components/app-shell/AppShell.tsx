"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

// PUBLIC_INTERFACE
export default function AppShell({ children }: AppShellProps) {
  /** Application shell: persistent sidebar + header with mobile off-canvas behavior. */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close the sidebar when the viewport becomes desktop-sized.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Prevent background scroll while the mobile sidebar is open.
  useEffect(() => {
    if (!sidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-dvh bg-[color:var(--app-bg)] text-slate-900">
      {/* Mobile overlay */}
      <div
        className={[
          "fixed inset-0 z-30 bg-slate-900/30 transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="lg:pl-72">
        <Header onOpenSidebar={openSidebar} />

        <main className="mx-auto max-w-screen-2xl px-4 py-6 lg:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
