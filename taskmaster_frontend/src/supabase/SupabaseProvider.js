import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase context provider with session management and auth helpers.
 * Requires environment variables:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 */

const SupabaseCtx = createContext(null);

// PUBLIC_INTERFACE
export function useSupabase() {
  /** Access raw Supabase client. */
  return useContext(SupabaseCtx)?.client;
}

// PUBLIC_INTERFACE
export function useSession() {
  /** Access auth session object and helpers. */
  const ctx = useContext(SupabaseCtx);
  return {
    session: ctx?.session,
    loading: ctx?.loading,
    signIn: ctx?.signIn,
    signUp: ctx?.signUp,
    signOut: ctx?.signOut,
  };
}

// PUBLIC_INTERFACE
export function SupabaseProvider({ children }) {
  /** Provider component that initializes Supabase and manages auth state. */
  const [client] = useState(() => {
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_KEY;
    if (!url || !key) {
      // eslint-disable-next-line no-console
      console.warn("Supabase env vars are missing. Provide REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY");
    }
    return createClient(url || "", key || "");
  });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, sess) => {
      setSession(sess ?? null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [client]);

  const signIn = async (email, password) => {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password) => {
    const SITE_URL = window.location.origin;
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: SITE_URL + "/auth" }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await client.auth.signOut();
  };

  const value = useMemo(() => ({
    client, session, loading, signIn, signUp, signOut
  }), [client, session, loading]);

  return (
    <SupabaseCtx.Provider value={value}>
      {children}
    </SupabaseCtx.Provider>
  );
}
