import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import "./App.css";
import { SupabaseProvider, useSession } from "./supabase/SupabaseProvider";
import Landing from "./pages/Landing";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Publish from "./pages/Publish";
import { NotificationsToaster } from "./components/NotificationsToaster";
import AIChatAssistant from "./components/AIChatAssistant";

// App Shell with topnav and sidebar
function Shell({ children }) {
  const location = useLocation();
  const { session, signOut } = useSession();

  const navItems = useMemo(() => ([
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/publish", label: "Publish", icon: "🚀" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ]), []);

  return (
    <div className="app-shell">
      <div className="topnav">
        <div className="brand">
          <div className="brand-badge">TM</div>
          <div>
            TaskMaster
            <div className="brand-sub">Ocean Professional</div>
          </div>
        </div>
        <div className="top-actions">
          {session ? (
            <>
              <span className="subtle">Hi, {session.user.email}</span>
              <Link className="btn" to="/dashboard">App</Link>
              <button className="btn" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link className="btn" to="/auth">Sign in</Link>
              <Link className="btn primary" to="/auth?mode=signup">Create account</Link>
            </>
          )}
        </div>
      </div>
      <div className="main">
        <aside className="sidebar" aria-label="Sidebar navigation">
          <div className="h2">Navigation</div>
          <nav className="nav-section">
            {navItems.map(n => (
              <Link key={n.to} to={n.to}
                className={`nav-item ${location.pathname === n.to ? "active" : ""}`}>
                <span aria-hidden>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="nav-section" style={{ marginTop: 16 }}>
            <div className="h2">Resources</div>
            <a className="nav-item" href="https://supabase.com/docs" target="_blank" rel="noreferrer">📘 Supabase Docs</a>
            <a className="nav-item" href="https://react.dev" target="_blank" rel="noreferrer">⚛️ React Docs</a>
          </div>
        </aside>
        <main className="content" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function ProtectedRoute({ children }) {
  /** Protects routes by requiring an active Supabase session. */
  const { session, loading } = useSession();
  if (loading) return <div className="page"><div className="subtle">Loading...</div></div>;
  return session ? children : <Navigate to="/auth" replace />;
}

// PUBLIC_INTERFACE
function AppRouter() {
  /** Main router including public and protected routes. */
  return (
    <BrowserRouter>
      <NotificationsToaster />
      <AIChatAssistant />
      <Routes>
        <Route path="/" element={<Shell><Landing /></Shell>} />
        <Route path="/auth" element={<Shell><AuthPage /></Shell>} />
        <Route path="/dashboard" element={<Shell><ProtectedRoute><Dashboard /></ProtectedRoute></Shell>} />
        <Route path="/settings" element={<Shell><ProtectedRoute><Settings /></ProtectedRoute></Shell>} />
        <Route path="/publish" element={<Shell><ProtectedRoute><Publish /></ProtectedRoute></Shell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  /** Root App with Supabase provider wrapping the router. */
  return (
    <SupabaseProvider>
      <AppRouter />
    </SupabaseProvider>
  );
}
