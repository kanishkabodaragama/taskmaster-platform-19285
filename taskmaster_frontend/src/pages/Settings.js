import React, { useState } from "react";

// PUBLIC_INTERFACE
export default function Settings() {
  /** Settings page for user preferences and notifications. */
  const [name, setName] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWeb, setNotifyWeb] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    setSaving(true); setMessage("");
    try {
      // Example RESTful call placeholder
      await new Promise(r => setTimeout(r, 800));
      setMessage("Settings saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h1">Settings</div>
          <div className="subtle">Manage your profile and notifications.</div>
        </div>
        <div>
          <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="h2">Profile</div>
          <div className="form-row">
            <label>Display name</label>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
          </div>
        </div>
        <div className="card">
          <div className="h2">Notifications</div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input type="checkbox" checked={notifyEmail} onChange={e=>setNotifyEmail(e.target.checked)} />
            Email notifications
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={notifyWeb} onChange={e=>setNotifyWeb(e.target.checked)} />
            Web notifications
          </label>
        </div>
      </div>

      {message && <div className="toast" role="status">{message}</div>}
    </div>
  );
}
