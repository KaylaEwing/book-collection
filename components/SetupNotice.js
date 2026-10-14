"use client";

import { useAuth } from "./AuthProvider";

// Shown only when the Supabase environment variables are missing, which
// happens on a fresh clone or on a deployment where the variables haven't
// been added yet. Without this the site would fail with no explanation of
// what is wrong, which is the least useful kind of error.
export default function SetupNotice() {
  const { configured } = useAuth();
  if (configured) return null;

  return (
    <div className="panel center" role="status">
      <h2 className="page-title">Database not connected</h2>
      <p className="lead">
        This copy of the site has no database connection yet, so accounts and
        books are unavailable.
      </p>
      <p style={{ marginTop: 12, fontSize: 16 }}>
        To connect it, add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
        <code>.env.local</code> when running locally, or to the project&apos;s
        environment variables on Vercel, then restart or redeploy. The steps are
        in the README.
      </p>
    </div>
  );
}
