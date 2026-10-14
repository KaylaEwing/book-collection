"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import styles from "./LoginForm.module.css";

// Logs in through Supabase Auth with an email address and password.
export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your email and password to log in.");
      return;
    }

    setBusy(true);
    setError("");
    const result = await login({ email: email.trim(), password });
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/books");
    router.refresh(); // let the server pick up the new session cookie
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <label htmlFor="email" className={styles.label}>
          Email:
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="password" className={styles.label}>
          Password:
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-light" disabled={busy}>
        {busy ? "LOGGING IN…" : "LOG IN"}
      </button>

      <p className={styles.message} role="alert">
        {error}
      </p>
    </form>
  );
}
