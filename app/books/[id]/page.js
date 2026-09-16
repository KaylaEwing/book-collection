"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import StarRating from "@/components/StarRating";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useBooks } from "@/components/BooksProvider";
import { statusLabel } from "@/lib/books";

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function BookDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { getBook, deleteBook, loaded } = useBooks();
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

  function handleDelete() {
    deleteBook(book.id);
    router.push("/books");
  }

  const rows = [
    ["Author", book.author],
    ["Status", statusLabel(book.status)],
    ["Rating", <StarRating key="r" value={book.rating} />],
    ["Added", formatDate(book.createdAt)],
    ["Last updated", formatDate(book.updatedAt)],
  ];

  return (
    <>
      <Link href="/books">Back to My Books</Link>
      <article className="panel" style={{ marginTop: 16 }}>
        <h1 className="page-title">{book.title}</h1>
        <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "10px 24px", marginTop: 20, fontSize: 17 }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: "contents" }}>
              <dt style={{ fontWeight: 600 }}>{label}</dt>
              <dd style={{ margin: 0 }}>{value}</dd>
            </div>
          ))}
        </dl>

        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 26, marginTop: 28 }}>Notes</h2>
        <p style={{ marginTop: 8, fontSize: 17, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {book.notes || "No notes yet."}
        </p>

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
        message={`"${book.title}" will be removed from your collection. This can't be undone.`}
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
