import HomeActions from "@/components/HomeActions";
import styles from "./page.module.css";

// Homepage from the Figma "log in" page.
export default function HomePage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>WELCOME!</h1>
      <p className={styles.subtitle}>
        Please register for an account or log in below:
      </p>
      <HomeActions />
    </div>
  );
}
