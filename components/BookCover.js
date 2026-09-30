import styles from "./BookCover.module.css";

// Shows a book's cover. If there isn't one, it draws a plain colored cover
// with the book's initials so the list still looks even.
const FALLBACK_COLORS = ["#2f5d62", "#7a3e48", "#5b7db1", "#6b4c00", "#3f5d3a"];

function initials(title) {
  return title
    .split(/\s+/)
    .filter((word) => /[a-z0-9]/i.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function colorFor(title) {
  let total = 0;
  for (const ch of title) total += ch.charCodeAt(0);
  return FALLBACK_COLORS[total % FALLBACK_COLORS.length];
}

export default function BookCover({ book, size = "card" }) {
  const className = `${styles.cover} ${size === "detail" ? styles.detail : styles.card}`;

  if (book.cover?.dataUrl) {
    return (
      // width and height are set so the page doesn't jump while the image
      // loads, and loading="lazy" keeps off-screen covers from downloading
      <img
        src={book.cover.dataUrl}
        alt={`Cover of ${book.title}`}
        width={book.cover.width}
        height={book.cover.height}
        loading="lazy"
        decoding="async"
        className={className}
      />
    );
  }

  return (
    <span className={`${className} ${styles.placeholder}`} style={{ background: colorFor(book.title) }} aria-hidden="true">
      {initials(book.title)}
    </span>
  );
}
