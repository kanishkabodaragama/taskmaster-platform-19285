import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSession, useSupabase } from "../supabase/SupabaseProvider";
import { useLiveTasks, listTasks, createTask, updateTask } from "../lib/tasks";
import { OpenAIService, buildTasksContext } from "../lib/openai";

/**
 * AIChatAssistant
 * - Floating button opens a sidebar drawer
 * - Sends chat messages to OpenAI with optional Supabase task context (user-consented)
 * - Can execute task operations when user confirms (create, update, find)
 * - Shows loading indicators and robust error messages
 */

// PUBLIC_INTERFACE
export default function AIChatAssistant() {
  /** Floating AI assistant available app-wide as a drawer. */
  const { session } = useSession();
  const client = useSupabase();
  const userId = session?.user?.id;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I’m your TaskMaster AI assistant. I can summarize, find, update, or create tasks. How can I help?" }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Permission to include user's task context in prompts
  const [allowContext, setAllowContext] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextSummary, setContextSummary] = useState("");

  // Local cache of tasks when context is enabled
  const { tasks, loading: tasksLoading } = useLiveTasks();

  // AI service instance
  const ai = useMemo(() => new OpenAIService(), []);

  // Keep ref to scroll to bottom on new messages
  const endRef = useRef(null);
  useEffect(() => {
    try { endRef.current?.scrollIntoView({ behavior: "smooth" }); } catch { /* ignore */ }
  }, [messages, open, busy]);

  // Build a system prompt with instructions for the assistant
  const systemPrompt = useMemo(() => {
    return [
      "You are TaskMaster AI, a helpful assistant for managing tasks.",
      "You can: summarize tasks, find tasks by keyword, suggest due dates, propose updates, and draft new tasks.",
      "When the user seems to request an action (create/update), respond with a step-by-step plan and a concise JSON block under a line that says ACTION:",
      "The JSON schema:",
      "{ type: 'create'|'update'|'none',",
      "  payload?: {",
      "    // for create",
      "    title?: string, description?: string, due_date?: string, status?: 'open'|'completed',",
      "    // for update",
      "    id?: string, patch?: { title?: string, description?: string, due_date?: string, status?: 'open'|'completed' }",
      "  }",
      "}",
      "Keep answers short and clear. If you are unsure, ask clarifying questions.",
      "Never execute actions yourself; only propose them in ACTION JSON.",
    ].join("\n");
  }, []);

  // Toggle open with keyboard shortcut (optional)
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey && e.key.toLowerCase() === "k") {
        setOpen(v => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Load and summarize context when permission toggled on
  useEffect(() => {
    if (!allowContext || !client || !userId || !ai.enabled) {
      setContextSummary("");
      return;
    }
    let active = true;
    (async () => {
      try {
        setContextLoading(true);
        // Use tasks already loaded; if empty and not loading, pull once
        let currentTasks = tasks;
        if (!tasksLoading && (!tasks || tasks.length === 0)) {
          currentTasks = await listTasks(client, userId);
        }
        const ctx = buildTasksContext(currentTasks || []);
        // Ask AI for a one-line context summary
        const resp = await ai.chat([
          { role: "system", content: "Summarize the provided task list in one concise sentence for the user." },
          { role: "user", content: ctx }
        ], { temperature: 0.2, max_tokens: 120 });
        if (!active) return;
        setContextSummary(resp.content || "");
      } catch {
        // ignore summarization errors, keep permission
        setContextSummary("");
      } finally {
        if (active) setContextLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowContext, client, userId, ai.enabled]);

  const send = async () => {
    if (!input.trim()) return;
    setError("");
    const userMsg = input.trim();
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setBusy(true);
    try {
      const contextBlock = (allowContext && tasks && tasks.length > 0)
        ? `\n\nUser tasks context:\n${buildTasksContext(tasks)}`
        : "";

      const resp = await ai.chat([
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg + contextBlock }
      ]);
      setMessages(m => [...m, { role: "assistant", content: resp.content || "(no content)" }]);
    } catch (e) {
      setError(e?.message || "AI request failed");
      setMessages(m => [...m, { role: "assistant", content: "Sorry, I couldn't process that request." }]);
    } finally {
      setBusy(false);
    }
  };

  // Parse proposed action JSON from assistant message
  const parseAction = (content) => {
    if (!content) return { type: "none" };
    const marker = "\nACTION:";
    const idx = content.indexOf(marker);
    if (idx === -1) return { type: "none" };
    const after = content.slice(idx + marker.length).trim();
    // Try to parse JSON from first code-block or raw line
    let jsonStr = after;
    const codeStart = after.indexOf("{");
    const codeEnd = after.lastIndexOf("}");
    if (codeStart !== -1 && codeEnd !== -1 && codeEnd > codeStart) {
      jsonStr = after.slice(codeStart, codeEnd + 1);
    }
    try {
      const obj = JSON.parse(jsonStr);
      if (!obj || typeof obj !== "object") return { type: "none" };
      return obj;
    } catch {
      return { type: "none" };
    }
  };

  const onExecuteAction = async (assistantMessage) => {
    const proposed = parseAction(assistantMessage?.content);
    if (!proposed || proposed.type === "none") {
      alert("No actionable JSON was found in the assistant message.");
      return;
    }
    if (!client || !userId) {
      alert("Please sign in to execute actions.");
      return;
    }

    const confirmed = window.confirm(`Do you want to execute this action?\n\n${JSON.stringify(proposed, null, 2)}`);
    if (!confirmed) return;

    try {
      if (proposed.type === "create") {
        const payload = proposed.payload || {};
        const created = await createTask(client, userId, {
          title: payload.title || "Untitled",
          description: payload.description || "",
          due_date: payload.due_date || null,
          status: payload.status || "open"
        });
        setMessages(m => [...m, { role: "assistant", content: `✅ Created task "${created.title}".` }]);
      } else if (proposed.type === "update") {
        const payload = proposed.payload || {};
        const taskId = payload.id;
        const patch = payload.patch || {};
        if (!taskId) throw new Error("Missing task id for update");
        const updated = await updateTask(client, taskId, patch);
        setMessages(m => [...m, { role: "assistant", content: `✅ Updated task "${updated.title}".` }]);
      } else {
        alert("Unsupported action type.");
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "Action failed");
    }
  };

  if (!ai.enabled) {
    // If no API key, render a subtle disabled state to avoid UI confusion
    return null;
  }

  return (
    <>
      {/* Floating button bottom-right */}
      <button
        className="btn primary"
        onClick={() => setOpen(true)}
        aria-label="Open AI assistant"
        style={{
          position: "fixed", right: 16, bottom: 16, zIndex: 110,
          boxShadow: "var(--shadow)"
        }}
      >
        🤖 Ask AI
      </button>

      {open && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="aiDrawerTitle">
          <div
            className="card"
            style={{
              width: "min(680px, 100%)",
              maxWidth: "100%",
              maxHeight: "90vh",
              display: "grid",
              gridTemplateRows: "auto 1fr auto",
              gap: 8,
              position: "relative"
            }}
          >
            <div className="page-header" style={{ marginBottom: 0 }}>
              <div>
                <div className="h1" id="aiDrawerTitle">AI Assistant</div>
                <div className="subtle">Ask about your tasks or request suggestions.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label title="Allow the assistant to read your tasks for better answers" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={allowContext}
                    onChange={e => setAllowContext(e.target.checked)}
                    disabled={!session}
                  />
                  Share task context
                </label>
                <button className="btn" onClick={() => setOpen(false)} aria-label="Close AI assistant">Close</button>
              </div>
            </div>

            {allowContext && (
              <div className="subtle" style={{ margin: "0 8px" }}>
                {contextLoading ? "Summarizing your tasks…" : (contextSummary || "Context enabled.")}
              </div>
            )}

            <div
              style={{
                overflowY: "auto",
                padding: 8,
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "#f9fafb"
              }}
            >
              {(messages || []).map((m, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, color: m.role === "assistant" ? "#1d4ed8" : "#111827" }}>
                    {m.role === "assistant" ? "Assistant" : "You"}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                  {m.role === "assistant" && m.content?.includes("ACTION:") && (
                    <div style={{ marginTop: 6 }}>
                      <button className="btn" onClick={() => onExecuteAction(m)}>Execute action</button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {error && <div style={{ color: "var(--error)" }}>{error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  placeholder={session ? "Ask me to find, summarize, or create tasks…" : "Sign in to get personalized help"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={busy}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                />
                <button className="btn primary" onClick={send} disabled={busy || (!session && allowContext)}>
                  {busy ? "Thinking…" : "Send"}
                </button>
              </div>
              <div className="subtle">
                Tip: Cmd/Ctrl+K toggles the assistant. Your tasks are only shared if you enable the checkbox.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
