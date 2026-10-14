"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import BookForm from "@/components/BookForm";
import { useBooks } from "@/components/BooksProvider";
import { useToast } from "@/components/Toast";

function EditBook() {
  const { id } = useParams();
  const router = useRouter();
  const { getBook, updateBook, loaded } = useBooks();
  const { showToast } = useToast();
  const [saveError, setSaveError] = useState("");

  if (!loaded) return <p className="status-text">Loading…</p>;

  const book = getBook(id);
  if (!book) {
    return (
      <div className="panel center">
        <h1 className="page-title">Book not found</h1>
        <div className="button-row center-row">
          <Link href="/books" className="btn-dark">Back to My Books</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(fields) {
    setSaveError("");
    try {
      await updateBook(book.id, fields);
      router.push(`/books/${book.id}`);
      showToast("Your changes were saved.");
    } catch (err) {
      setSaveError(err.message);
      throw err;
    }
  }

  return (
    <>
      <h1 className="page-title">Edit book</h1>
      {saveError && <p className="error-text" role="alert">{saveError}</p>}
      <BookForm
        initial={book}
        submitLabel="SAVE CHANGES"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/books/${book.id}`)}
      />
    </>
  );
}

export default function EditBookPage() {
  return (
    <div className="container narrow">
      <RequireAuth>
        <EditBook />
      </RequireAuth>
    </div>
  );
}
