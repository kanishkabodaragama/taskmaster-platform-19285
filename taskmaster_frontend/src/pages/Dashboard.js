import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// PUBLIC_INTERFACE
export default function Dashboard() {
  /** Dashboard with KPI cards and charts. */
  const kpis = useMemo(()=>[
    { label: "Open Tasks", value: 58, trend: "+5%" },
    { label: "Velocity", value: "32 pts", trend: "+12%" },
    { label: "Published Pages", value: 9, trend: "+1" },
  ], []);

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h1">Dashboard</div>
          <div className="subtle">Overview of your work and performance metrics.</div>
        </div>
        <div>
          <button className="btn">Refresh</button>
          <button className="btn primary" style={{ marginLeft: 8 }}>New Task</button>
        </div>
      </div>

      <div className="grid cols-3">
        {kpis.map(k=>(
          <div key={k.label} className="card kpi">
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
            <div className="trend">{k.trend}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="h2">Weekly completion</div>
        <Line data={data} options={options} />
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="h2">Notifications</div>
          <ul className="subtle" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Build completed successfully.</li>
            <li>New comment on "Release notes".</li>
            <li>Deployment scheduled for 18:00 UTC.</li>
          </ul>
        </div>
        <div className="card">
          <div className="h2">Recent activity</div>
          <ul className="subtle" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Task "QA review" moved to Done.</li>
            <li>Page "Changelog" updated.</li>
            <li>Velocity increased by 12% this week.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
