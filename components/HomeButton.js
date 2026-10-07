"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import styles from "@/app/page.module.css";

// The "Take me to my books" button from the Figma home page.
// Signed-in readers go straight to their collection; everyone else logs in first.
export default function HomeButton() {
  const { user, ready } = useAuth();
  const href = !ready || user ? "/books" : "/login";

  return (
    <Link href={href} className={styles.cta}>
      Take me to my books
    </Link>
  );
}
