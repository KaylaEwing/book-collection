"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import StarRating from "@/components/StarRating";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useBooks } from "@/components/BooksProvider";
import { useToast } from "@/components/Toast";
import { STATUSES, statusLabel } from "@/lib/books";
import styles from "./detail.module.css";

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function BookDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { getBook, updateBook, deleteBook, restoreBook, loaded } = useBooks();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);

  if (!loaded) return <p className="status-text">Loading…</p>;

  const book = getBook(id);
  if (!book) {
    return (
      <div className="panel center">
        <h1 className="page-title">Book not found</h1>
        <p className="lead">It may have been deleted.</p>
        <div className="button-row center-row">
          <Link href="/books" className="btn-dark">Back to My Books</Link>
        </div>
      </div>
    );
  }

  // Quick status change without opening the edit form
  function changeStatus(next) {
    if (next === book.status) return;
    updateBook(book.id, { status: next });
    showToast(`Moved to "${statusLabel(next)}".`);
  }

  function handleDelete() {
    const removed = deleteBook(book.id);
    setConfirming(false);
    router.push("/books");
    if (removed) {
      showToast(`"${removed.book.title}" was deleted.`, {
        label: "Undo",
        onClick: () => restoreBook(removed.book, removed.index),
      });
    }
  }

  const rows = [
    ["Author", book.author],
    ["Rating", <StarRating key="r" value={book.rating} />],
    ["Added", formatDate(book.createdAt)],
    ["Last updated", formatDate(book.updatedAt)],
  ];

  return (
    <>
      <Link href="/books" className={styles.back}>Back to My Books</Link>

      <article className="panel" style={{ marginTop: 16 }}>
        <span className={`${styles.badge} ${styles[book.status]}`}>{statusLabel(book.status)}</span>
        <h1 className="page-title" style={{ marginTop: 10 }}>{book.title}</h1>

        <dl className={styles.facts}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: "contents" }}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        {/* Custom feature: change the reading status in one click */}
        <div className={styles.quick}>
          <span className={styles.quickLabel}>Move this book to:</span>
          <div className={styles.quickButtons} role="group" aria-label="Change reading status">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                className={styles.quickButton}
                aria-pressed={book.status === s.value}
                onClick={() => changeStatus(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <h2 className={styles.notesHeading}>Notes</h2>
        <p className={styles.notes}>{book.notes || "No notes yet."}</p>

        <div className="button-row">
          <Link href={`/books/${book.id}/edit`} className="btn-dark">Edit book</Link>
          <button type="button" className="btn-outline btn-danger" onClick={() => setConfirming(true)}>
            Delete book
          </button>
        </div>
      </article>

      <ConfirmDialog
        open={confirming}
        title="Delete this book?"
        message={`"${book.title}" will be removed from your collection. You can undo this right after.`}
        confirmLabel="Delete book"
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

export default function BookDetailPage() {
  return (
    <div className="container narrow">
      <RequireAuth>
        <BookDetail />
      </RequireAuth>
    </div>
  );
}
