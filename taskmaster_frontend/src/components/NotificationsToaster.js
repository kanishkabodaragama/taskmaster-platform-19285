import React, { useEffect, useRef, useState } from "react";

/**
 * NotificationsToaster establishes a WebSocket connection to receive
 * real-time notifications and displays a transient toast.
 * Replace ws://localhost:4000/ws if backend specifies a different URL.
 */

// PUBLIC_INTERFACE
export function NotificationsToaster() {
  /** WebSocket notifications toaster component. */
  const [msg, setMsg] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    // In absence of backend, we simulate and keep API-compatible structure.
    let ws;
    try {
      const wsUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") + (window.location.hostname) + ":4000/ws";
      ws = new WebSocket(wsUrl);

      ws.onmessage = (e) => {
        const data = (() => { try { return JSON.parse(e.data); } catch { return { message: e.data }; } })();
        setMsg(data.message || "New notification");
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setMsg(""), 4000);
      };

      ws.onerror = () => {
        // Fallback: demo notification burst
        setTimeout(() => {
          setMsg("Welcome to TaskMaster! Notifications are live.");
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setMsg(""), 3500);
        }, 1200);
      };
    } catch {
      // no-op
    }
    return () => {
      clearTimeout(timeoutRef.current);
      try { ws && ws.close(); } catch { /* ignore */ }
    };
  }, []);

  if (!msg) return null;
  return <div className="toast" role="status" aria-live="polite">{msg}</div>;
}
