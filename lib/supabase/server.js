import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for API routes and server components. It reads the signed-in
// user from the session cookie, so every query runs as that user and Row Level
// Security applies.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a server component, where cookies are read-only.
          // The middleware refreshes the session instead.
        }
      },
    },
  });
}

// Returns the signed-in user, or null. Used by every API route.
// `configured` is false when the environment variables are missing, which
// lets the routes answer with a setup message instead of a generic failure.
export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null, configured: false };

  const { data, error } = await supabase.auth.getUser();
  if (error) return { supabase, user: null, configured: true };
  return { supabase, user: data.user, configured: true };
}
