"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

// Shows the page only to logged-in users.
export default function RequireAuth({ children }) {
  const { user, ready } = useAuth();

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
