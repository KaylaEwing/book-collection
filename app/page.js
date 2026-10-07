import HomeButton from "@/components/HomeButton";
import styles from "./page.module.css";

// Home page, built from the Figma "home page" design (node 2:2).
export default function HomePage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Let’s read!</h1>

      <div className={styles.quotes}>
        <p className={styles.quote}>
          Every book you read is a new story added to your shelves, and every
          page turned is a memory kept.
        </p>

        {/* Replace public/library.jpg with the photo exported from Figma */}
        <img
          src="/library.jpg"
          alt="A reading nook with full bookshelves and an armchair"
          width="654"
          height="304"
          className={styles.photo}
        />

        <p className={styles.quote}>
          Log your library, track your reading journeys, and settle in with your
          next favorite chapter.
        </p>
      </div>

      <HomeButton />
    </div>
  );
}
