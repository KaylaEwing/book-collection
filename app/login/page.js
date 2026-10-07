import Link from "next/link";
import LoginForm from "@/components/LoginForm";
import styles from "./login.module.css";

export const metadata = { title: "Log in | Book Collection" };

// This page follows the original Figma "log in" design: the welcome
// heading, the username and password form, and the register button.
export default function LoginPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>WELCOME!</h1>
      <p className={styles.subtitle}>
        Please register for an account or log in below:
      </p>

      <LoginForm />

      <section className={styles.register} aria-labelledby="register-label">
        <p id="register-label" className={styles.registerLabel}>
          Click here to register:
        </p>
        <Link href="/register" className="btn-light">
          REGISTER
        </Link>
      </section>
    </div>
  );
}
