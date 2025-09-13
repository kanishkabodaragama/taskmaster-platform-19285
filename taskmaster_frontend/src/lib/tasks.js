import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabase, useSession } from "../supabase/SupabaseProvider";

/**
 * Task data helpers. Expected Supabase schema:
 * - table: tasks
 *   columns: id, user_id (uuid), title, description, status ('open'|'completed'), due_date (date), created_at (timestamptz), updated_at (timestamptz)
 * 
 * Stats returned:
 * - total: all tasks for user
 * - completed: status = 'completed'
 * - open: status != 'completed'
 * - dueToday: due_date = today and not completed
 * - overdue: due_date < today and not completed
 */

// PUBLIC_INTERFACE
export function useTaskStats() {
  /** Returns live task stats for the current user and auto-updates via realtime. */
  const client = useSupabase();
  const { session } = useSession();
  const userId = session?.user?.id;

  const [stats, setStats] = useState({ total: 0, completed: 0, open: 0, dueToday: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!client || !userId) return;
    setError("");
    setLoading(true);
    try {
      // Total
      const { count: total, error: e1 } = await client
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (e1) throw e1;

      // Completed
      const { count: completed, error: e2 } = await client
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");
      if (e2) throw e2;

      // Open (not completed)
      const { count: open, error: e3 } = await client
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .neq("status", "completed");
      if (e3) throw e3;

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      // Due today (not completed)
      const { count: dueToday, error: e4 } = await client
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .neq("status", "completed")
        .eq("due_date", todayStr);
      if (e4) throw e4;

      // Overdue (due_date < today, not completed)
      const { count: overdue, error: e5 } = await client
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .neq("status", "completed")
        .lt("due_date", todayStr);
      if (e5) throw e5;

      setStats({ total: total ?? 0, completed: completed ?? 0, open: open ?? 0, dueToday: dueToday ?? 0, overdue: overdue ?? 0 });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to refresh task stats:", err);
      setError(err?.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [client, userId]);

  useEffect(() => {
    if (!client || !userId) return;
    let active = true;
    (async () => {
      await refresh();
    })();

    // Realtime: subscribe to changes on tasks table scoped to this user.
    const channel = client
      .channel("tasks-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        () => {
          // debounce refresh slightly
          setTimeout(() => {
            if (active) refresh();
          }, 100);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // ok
        }
      });

    return () => {
      active = false;
      try { client.removeChannel(channel); } catch { /* ignore */ }
    };
  }, [client, userId, refresh]);

  return useMemo(() => ({ stats, loading, error, refresh }), [stats, loading, error, refresh]);
}

// PUBLIC_INTERFACE
export async function createTask(client, userId, { title, description = "", due_date = null, status = "open" }) {
  /** Create a task for the given user. */
  if (!client || !userId) throw new Error("Not authenticated");
  const payload = { title, description, user_id: userId, status, due_date };
  const { data, error } = await client.from("tasks").insert(payload).select().single();
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function updateTask(client, taskId, patch) {
  /** Update task by id with partial fields. */
  if (!client || !taskId) throw new Error("Task not specified");
  const { data, error } = await client.from("tasks").update(patch).eq("id", taskId).select().single();
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function getTask(client, taskId) {
  /** Fetch a single task by id. */
  const { data, error } = await client.from("tasks").select("*").eq("id", taskId).single();
  if (error) throw error;
  return data;
}

// PUBLIC_INTERFACE
export async function listTasks(client, userId, { status, search } = {}) {
  /** List tasks for the user with optional status and text search. */
  if (!client || !userId) throw new Error("Not authenticated");
  let q = client.from("tasks").select("*").eq("user_id", userId).order("due_date", { ascending: true }).order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  if (search) q = q.ilike("title", `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
