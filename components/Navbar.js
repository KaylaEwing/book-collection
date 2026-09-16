"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import styles from "./Navbar.module.css";

// Top navigation, based on the Figma "Navigation" component.
// Links change depending on whether someone is logged in.
const memberLinks = [
  { href: "/books", label: "My Books" },
  { href: "/books/new", label: "Add a Book" },
  { href: "/about", label: "About" },
];

const guestLinks = [
  { href: "/about", label: "About" },
  { href: "/login", label: "Log In" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the page changes
  useEffect(() => setOpen(false), [pathname]);

  const links = user ? memberLinks : guestLinks;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main">
        <Link href="/" className={styles.name}>
          Kayla Ewing
        </Link>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="main-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
        </button>

        <div id="main-menu" className={`${styles.extra} ${open ? styles.open : ""}`}>
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={styles.link}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {user ? (
            <div className={styles.account}>
              <span className={styles.user}>Hi, {user.username}</span>
              <button type="button" className={styles.button} onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <Link href="/register" className={styles.button}>
              Let’s read together
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
