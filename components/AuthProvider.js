"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

// Accounts are handled by Supabase Auth. Passwords are hashed and stored by
// Supabase; this application never sees or stores them. The session lives in
// a cookie, so it survives a refresh and works on any device.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null until the Supabase environment variables are set. Every function
  // below checks for that, so the site explains what is missing instead of
  // crashing on a fresh clone or an unconfigured deployment.
  const supabase = getSupabaseBrowserClient();
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  const loadProfile = useCallback(
    async (currentUser) => {
      if (!supabase || !currentUser) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", currentUser.id)
        .maybeSingle();
      setProfile(data ?? null);
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) {
      setReady(true); // nothing to load; the setup notice is shown instead
      return;
    }

    let active = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      await loadProfile(data.user ?? null);
      setReady(true);
    });

    // Fires on log in, log out, and token refresh, in this tab or another one.
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  async function register({ email, password, username }) {
    if (!supabase) return { error: NOT_CONFIGURED };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // The username is saved with the account and copied into the profiles
      // table by a database trigger.
      options: { data: { username } },
    });

    if (error) return { error: friendlyMessage(error.message) };

    // If the project has email confirmation switched on there is no session yet.
    if (!data.session) {
      return { needsConfirmation: true };
    }
    return { user: data.user };
  }

  async function login({ email, password }) {
    if (!supabase) return { error: NOT_CONFIGURED };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyMessage(error.message) };
    return { user: data.user };
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const value = useMemo(
    () => ({
      user,
      ready,
      configured,
      // The navigation shows the username when there is one, and falls back
      // to the part of the email before the @ until the profile loads.
      username: profile?.username ?? user?.email?.split("@")[0] ?? "",
      register,
      login,
      logout,
    }),
    [user, profile, ready, configured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const NOT_CONFIGURED =
  "This site isn't connected to its database yet, so accounts can't be created or used.";

// Supabase messages are written for developers; these are for readers.
function friendlyMessage(message = "") {
  const text = message.toLowerCase();
  if (text.includes("invalid login credentials")) {
    return "That email and password don't match an account.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "An account already uses that email. Try logging in instead.";
  }
  if (text.includes("password")) {
    return "That password was rejected. Use at least 8 characters.";
  }
  if (text.includes("email")) {
    return "Check the email address and try again.";
  }
  if (text.includes("fetch") || text.includes("network")) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
}

export function useAuth() {
  return useContext(AuthContext);
}
