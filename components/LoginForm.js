"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import styles from "./LoginForm.module.css";

// Log in form from the Figma "Login" frame. Used on the homepage and /login.
export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Enter your username and password to log in.");
      return;
    }

    // TODO (backend): replace with supabase.auth.signInWithPassword()
    const result = login(username);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/books");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <label htmlFor="username" className={styles.label}>
          Username:
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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

      <button type="submit" className="btn-light">
        LOG IN
      </button>

      <p className={styles.message} role="alert">
        {error}
      </p>
    </form>
  );
}
