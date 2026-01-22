"use client";

import { useEffect, useRef, useState } from "react";

type PollState<T> =
  | { status: "idle"; data?: undefined; error?: undefined; lastUpdatedAt?: undefined }
  | { status: "loading"; data?: T; error?: undefined; lastUpdatedAt?: number }
  | { status: "success"; data: T; error?: undefined; lastUpdatedAt: number }
  | { status: "error"; data?: T; error: Error; lastUpdatedAt?: number };

type Options = {
  intervalMs: number;
  enabled?: boolean;
  /** If true, will do an immediate fetch on mount/enabled. Default: true */
  immediate?: boolean;
};

// PUBLIC_INTERFACE
export function usePollingQuery<T>(
  /** Polling hook for REST endpoints. Designed so it can be swapped to SSE/WebSocket later. */
  fetcher: () => Promise<T>,
  options: Options
): { state: PollState<T>; refresh: () => Promise<void> } {
  const { intervalMs, enabled = true, immediate = true } = options;

  const [state, setState] = useState<PollState<T>>({ status: "idle" });
  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  const refresh = async () => {
    if (!enabled) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setState((prev) => ({
      status: prev.status === "success" ? "loading" : "loading",
      data: prev.data,
      error: undefined,
      lastUpdatedAt: prev.lastUpdatedAt,
    }));

    try {
      const data = await fetcher();
      setState({ status: "success", data, lastUpdatedAt: Date.now() });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Request failed.");
      setState((prev) => ({
        status: "error",
        data: prev.data,
        error: err,
        lastUpdatedAt: prev.lastUpdatedAt,
      }));
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    if (immediate) {
      void refresh();
    }

    timerRef.current = window.setInterval(() => {
      void refresh();
    }, intervalMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, intervalMs]);

  return { state, refresh };
}
