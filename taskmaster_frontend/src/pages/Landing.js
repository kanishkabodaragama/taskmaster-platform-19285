import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export default function Landing() {
  /** Marketing landing page with Ocean Professional styling. */
  return (
    <div className="page">
      <div className="hero">
        <div>
          <h1 className="hero-headline">
            Manage tasks, insights, and publishing — in one modern dashboard.
          </h1>
          <p className="hero-sub">
            TaskMaster helps teams plan, track, and publish effortlessly. Built with a clean, professional UI and real-time notifications.
          </p>
          <div className="cta">
            <Link to="/auth?mode=signup" className="btn primary">Get started</Link>
            <Link to="/dashboard" className="btn">View demo</Link>
          </div>
          <div style={{ marginTop: 16, color: "#6b7280" }}>
            Ocean Professional • Blue and amber accents • Smooth, responsive experience
          </div>
        </div>
        <div className="hero-card">
          <div className="grid cols-2">
            <div className="card kpi">
              <div className="label">Active Projects</div>
              <div className="value">12</div>
              <div className="trend">+8% this week</div>
            </div>
            <div className="card kpi">
              <div className="label">Tasks Completed</div>
              <div className="value">324</div>
              <div className="trend">+12% this week</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }} className="subtle">
            Analytics preview and KPIs update in real-time.
          </div>
        </div>
      </div>
    </div>
  );
}
