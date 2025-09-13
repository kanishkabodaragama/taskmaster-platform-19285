import React, { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend
} from "chart.js";
import { useTaskStats, createTask, useLiveTasks } from "../lib/tasks";
import { useSupabase, useSession } from "../supabase/SupabaseProvider";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// PUBLIC_INTERFACE
export default function Dashboard() {
  /** Dashboard with KPI cards and charts fed by live Supabase stats and Create Task modal. Shows live task list. */
  const { stats, loading, error, refresh } = useTaskStats();
  const client = useSupabase();
  const { session } = useSession();
  const userId = session?.user?.id;

  // Live task list (all tasks)
  const { tasks, loading: tasksLoading, error: tasksError, refresh: reloadTasks } = useLiveTasks();

  // Modal state and form fields
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("open");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const kpis = useMemo(()=>[
    { key: "total", label: "Total Tasks", value: stats.total, hint: "" },
    { key: "completed", label: "Completed", value: stats.completed, hint: "" },
    { key: "overdue", label: "Overdue", value: stats.overdue, hint: "" },
  ], [stats]);

  const data = useMemo(()=>({
    labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    datasets: [
      {
        label: "Completed Tasks",
        data: [8,12,9,14,11,7,10],
        borderColor: "#2563EB",
        backgroundColor: "rgba(37, 99, 235, 0.15)",
        tension: 0.35,
        fill: true
      }
    ]
  }), []);

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: "rgba(0,0,0,0.05)" } },
      x: { grid: { display: false } }
    }
  };

  const onQuickNewTask = async () => {
    try {
      const due = new Date();
      due.setDate(due.getDate() + 1);
      const yyyy = due.getFullYear();
      const mm = String(due.getMonth() + 1).padStart(2, "0");
      const dd = String(due.getDate()).padStart(2, "0");
      const dueStr = `${yyyy}-${mm}-${dd}`;
      await createTask(client, userId, { title: "New task", description: "Quick created from dashboard", due_date: dueStr, status: "open" });
      // refresh will be triggered by realtime; manual fallback:
      setTimeout(() => { refresh(); reloadTasks(); }, 150);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "Failed to create task");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setStatus("open");
    setFormError("");
  };

  const openModal = () => {
    resetForm();
    setShowCreate(true);
  };

  const closeModal = () => {
    setShowCreate(false);
  };

  const validate = () => {
    if (!title.trim()) return "Title is required";
    if (title.length > 200) return "Title is too long (max 200 characters)";
    if (description.length > 2000) return "Description is too long (max 2000 characters)";
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return "Due date must be YYYY-MM-DD";
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }
    setSubmitting(true);
    try {
      await createTask(client, userId, {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || null,
        status
      });
      // Optimistic UX: close modal immediately
      closeModal();
      // Realtime should update KPIs and list; also force quick refresh as fallback
      setTimeout(() => { refresh(); reloadTasks(); }, 150);
    } catch (err) {
      setFormError(err?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      // Accepts yyyy-mm-dd or ISO string
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) return d;
      return date.toLocaleDateString();
    } catch {
      return d;
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h1">Dashboard</div>
          <div className="subtle">Overview of your work and performance metrics.</div>
        </div>
        <div>
          <button className="btn" onClick={() => { refresh(); reloadTasks(); }} disabled={loading || tasksLoading}>Refresh</button>
          <button className="btn" style={{ marginLeft: 8 }} onClick={onQuickNewTask} disabled={!userId}>Quick Task</button>
          <button className="btn primary" style={{ marginLeft: 8 }} onClick={openModal} disabled={!userId}>Create Task</button>
        </div>
      </div>

      <div className="grid cols-3">
        {kpis.map(k=>(
          <div key={k.key} className="card kpi">
            <div className="label">{k.label}</div>
            <div className="value">{loading ? "…" : (k.value ?? 0)}</div>
            {k.key === "overdue" ? (
              <div className="trend" style={{ background: stats.overdue > 0 ? "#fee2e2" : "#d1fae5", color: stats.overdue > 0 ? "#991b1b" : "#065f46" }}>
                {stats.overdue > 0 ? `${stats.overdue} need attention` : "On track"}
              </div>
            ) : (
              <div className="trend">{k.hint || "Live"}</div>
            )}
          </div>
        ))}
      </div>

      {error && <div style={{ color: "var(--error)", marginTop: 8 }}>{error}</div>}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="h2">Weekly completion</div>
        <Line data={data} options={options} />
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="h2">Due today</div>
          <div className="kpi">
            <div className="label">Tasks due today</div>
            <div className="value">{loading ? "…" : (stats.dueToday ?? 0)}</div>
            <div className="trend">Live</div>
          </div>
        </div>
        <div className="card">
          <div className="h2">Your tasks</div>
          {(tasksError) && <div style={{ color: "var(--error)" }}>{tasksError}</div>}
          <div className="subtle" style={{ marginBottom: 8 }}>{tasksLoading ? "Loading…" : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`}</div>
          <div style={{ display: "grid", gap: 10 }}>
            {tasks.map((t) => (
              <div key={t.id} className="card" style={{ borderColor: "#E5E7EB" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.title}</div>
                    {t.description && <div className="subtle" style={{ marginTop: 4 }}>{t.description}</div>}
                    <div className="subtle" style={{ marginTop: 6 }}>
                      Status: <span style={{ fontWeight: 600, color: t.status === "completed" ? "#065f46" : "#1d4ed8" }}>{t.status}</span>
                      {" "}• Due: <span>{fmtDate(t.due_date)}</span>
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "4px 8px",
                        borderRadius: 999,
                        background: t.status === "completed" ? "#d1fae5" : "#eff6ff",
                        color: t.status === "completed" ? "#065f46" : "#1d4ed8",
                        border: "1px solid #E5E7EB"
                      }}
                    >
                      {t.status === "completed" ? "✓ Completed" : "Open"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(!tasksLoading && tasks.length === 0) && (
              <div className="subtle">No tasks yet. Create your first task to get started.</div>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <div role="dialog" aria-modal="true" aria-labelledby="createTaskTitle"
             style={{
               position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)",
               display: "grid", placeItems: "center", padding: 16, zIndex: 100
             }}>
          <div className="card" style={{ width: "min(560px, 100%)", maxWidth: "100%" }}>
            <div className="page-header" style={{ marginBottom: 8 }}>
              <div className="h1" id="createTaskTitle">Create Task</div>
              <div>
                <button className="btn" type="button" onClick={closeModal} disabled={submitting}>Close</button>
              </div>
            </div>
            <form onSubmit={submit}>
              <div className="form-row">
                <label htmlFor="taskTitle">Title</label>
                <input id="taskTitle" className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g., Prepare quarterly report" required maxLength={200} />
              </div>
              <div className="form-row">
                <label htmlFor="taskDesc">Description</label>
                <textarea id="taskDesc" className="input" rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional details…" maxLength={2000} />
              </div>
              <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label htmlFor="taskDue">Due date</label>
                  <input id="taskDue" className="input" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="taskStatus">Status</label>
                  <select id="taskStatus" className="input" value={status} onChange={e=>setStatus(e.target.value)}>
                    <option value="open">Open</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              {formError && <div style={{ color: "var(--error)", marginBottom: 8 }}>{formError}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={closeModal} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn primary" disabled={submitting || !userId}>
                  {submitting ? "Creating..." : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
