const BASE_URL = process.env.REACT_APP_API_BASE || "";

async function handle(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

// PUBLIC_INTERFACE
export async function get(path) {
  /** Perform a GET request to the backend REST API. */
  const res = await fetch(`${BASE_URL}${path}`, { credentials: "include" });
  return handle(res);
}

// PUBLIC_INTERFACE
export async function post(path, body) {
  /** Perform a POST request to the backend REST API. */
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  return handle(res);
}
