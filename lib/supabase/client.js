"use client";

import { createBrowserClient } from "@supabase/ssr";

// Supabase client for code running in the browser. The anon key is safe to
// publish: Row Level Security on the database decides what it may read.
//
// Both values come from environment variables. Until those are set (a fresh
// clone, or a Vercel project whose variables haven't been added yet) there is
// no client to make, so these helpers report that instead of throwing. The
// site then shows a short setup notice rather than a blank error page.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

let client;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}
