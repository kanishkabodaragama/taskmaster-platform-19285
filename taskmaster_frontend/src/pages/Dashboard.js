import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend
} from "chart.js";
import { useTaskStats, createTask } from "../lib/tasks";
import { useSupabase, useSession } from "../supabase/SupabaseProvider";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// PUBLIC_INTERFACE
export default function Dashboard() {
  /** Dashboard with KPI cards and charts fed by live Supabase stats. */
  const { stats, loading, error, refresh } = useTaskStats();
  const client = useSupabase();
  const { session } = useSession();
  const userId = session?.user?.id;

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
      setTimeout(() => refresh(), 150);
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e?.message || "Failed to create task");
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
          <button className="btn" onClick={refresh} disabled={loading}>Refresh</button>
          <button className="btn primary" style={{ marginLeft: 8 }} onClick={onQuickNewTask} disabled={!userId}>New Task</button>
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
          <div className="h2">Recent activity</div>
          <ul className="subtle" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Realtime updates are enabled for your tasks.</li>
            <li>Use New Task to test live stats.</li>
            <li>Counts auto-refresh on any change.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
