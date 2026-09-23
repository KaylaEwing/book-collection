"use client";

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

  return (
    <>
      <h1 className="page-title">Edit book</h1>
      <BookForm
        initial={book}
        submitLabel="SAVE CHANGES"
        onSubmit={(fields) => {
          updateBook(book.id, fields);
          router.push(`/books/${book.id}`);
          showToast("Your changes were saved.");
        }}
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
