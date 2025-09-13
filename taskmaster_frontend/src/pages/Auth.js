import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../supabase/SupabaseProvider";

// PUBLIC_INTERFACE
export default function AuthPage() {
  /** Authentication page supporting sign in and sign up with Supabase. */
  const { signIn, signUp, session } = useSession();
  const nav = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const defaultMode = params.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useMemo(() => {
    if (session) nav("/dashboard", { replace: true });
  }, [session, nav]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setError(err?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page auth-card">
      <div className="page-header">
        <div>
          <div className="h1">{mode === "signin" ? "Welcome back" : "Create your account"}</div>
          <div className="subtle">Use your email and password to {mode === "signin" ? "sign in" : "sign up"}.</div>
        </div>
      </div>
      <form onSubmit={onSubmit}>
        <div className="form-row">
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div className="form-row">
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
        </div>
        {error && <div style={{ color: "var(--error)", marginBottom: 8 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn primary" type="submit" disabled={busy}>{busy ? "Please wait..." : (mode === "signin" ? "Sign in" : "Sign up")}</button>
          <button className="btn" type="button" onClick={()=>setMode(m => m === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create account" : "I have an account"}
          </button>
        </div>
      </form>
      <div className="subtle" style={{ marginTop: 12 }}>
        By continuing you agree to our Terms and Privacy Policy.
      </div>
    </div>
  );
}
