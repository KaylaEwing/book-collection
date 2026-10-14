"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import SetupNotice from "./SetupNotice";

// Shows the page only to logged-in users. The API routes check this again on
// the server, and Row Level Security checks it a third time in the database,
// so hiding the page here is a convenience, not the security itself.
export default function RequireAuth({ children }) {
  const { user, ready, configured } = useAuth();

  if (!configured) return <SetupNotice />;
  if (!ready) return <p className="status-text">Loading…</p>;

  if (!user) {
    return (
      <div className="panel center">
        <h1 className="page-title">Log in to see your books</h1>
        <p className="lead">Your collection is private to your account.</p>
        <div className="button-row center-row">
          <Link href="/login" className="btn-dark">Log in</Link>
          <Link href="/register" className="btn-outline">Register</Link>
        </div>
      </div>
    );
  }

  return children;
}
