"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import LoginForm from "./LoginForm";
import styles from "@/app/page.module.css";

// Logged out: the Figma log in + register area.
// Logged in: shortcuts to the collection.
export default function HomeActions() {
  const { user, ready } = useAuth();

  if (!ready) return null;

  if (user) {
    return (
      <div className={styles.register}>
        <p className={styles.registerLabel}>Welcome back, {user.username}.</p>
        <div className="button-row center-row">
          <Link href="/books" className="btn-light">MY BOOKS</Link>
          <Link href="/books/new" className="btn-light">ADD A BOOK</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoginForm />
      <section className={styles.register} aria-labelledby="register-label">
        <p id="register-label" className={styles.registerLabel}>
          Click here to register:
        </p>
        <Link href="/register" className="btn-light">
          REGISTER
        </Link>
      </section>
    </>
  );
}
