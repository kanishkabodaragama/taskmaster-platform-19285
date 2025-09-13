import React, { useState } from "react";

// PUBLIC_INTERFACE
export default function Publish() {
  /** Website publishing page with simulated deployment workflow. */
  const [status, setStatus] = useState("idle");
  const [url, setUrl] = useState("");

  const start = async () => {
    setStatus("building");
    await new Promise(r => setTimeout(r, 1000));
    setStatus("deploying");
    await new Promise(r => setTimeout(r, 1200));
    setStatus("success");
    setUrl("https://example-site.taskmaster.app");
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="h1">Publish your site</div>
          <div className="subtle">Build and deploy your website with one click.</div>
        </div>
        <div>
          <button className="btn primary" onClick={start} disabled={status !== "idle"}>{status === "idle" ? "Publish" : "Working..."}</button>
        </div>
      </div>

      <div className="card">
        <div className="h2">Deployment status</div>
        <ul className="subtle" style={{ paddingLeft: 18 }}>
          <li>Build: {status === "idle" ? "Pending" : status !== "idle" ? "Completed" : ""}</li>
          <li>Deploy: {status === "success" ? "Completed" : (status === "deploying" ? "In progress" : "Pending")}</li>
        </ul>
        {status === "success" && (
          <div style={{ marginTop: 10 }}>
            <div>Published at: <a href={url} target="_blank" rel="noreferrer">{url}</a></div>
          </div>
        )}
      </div>
    </div>
  );
}
