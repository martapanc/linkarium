"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "linkarium_write_token";

export function useWriteToken() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(sessionStorage.getItem(STORAGE_KEY));
    setReady(true);
  }, []);

  const save = useCallback((t: string) => {
    sessionStorage.setItem(STORAGE_KEY, t);
    setToken(t);
  }, []);

  const clear = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  /** Wrap fetch() to inject the write token header on mutating requests. */
  const authFetch: typeof fetch = useCallback(
    (input, init) => {
      if (!token) return fetch(input, init);
      const method = (init?.method ?? "GET").toUpperCase();
      if (["GET", "HEAD", "OPTIONS"].includes(method)) return fetch(input, init);
      return fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          "x-write-token": token,
        },
      });
    },
    [token],
  );

  return { token, ready, save, clear, authFetch };
}
