"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import BookForm from "@/components/BookForm";
import { useBooks } from "@/components/BooksProvider";
import { useToast } from "@/components/Toast";

function AddBook() {
  const router = useRouter();
  const { addBook } = useBooks();
  const { showToast } = useToast();
  const [saveError, setSaveError] = useState("");

  async function handleSubmit(fields) {
    setSaveError("");
    try {
      const book = await addBook(fields);
      router.push(`/books/${book.id}`);
      showToast(`"${book.title}" was added to your collection.`);
    } catch (err) {
      // Thrown when the database or the network refuses the save
      setSaveError(err.message);
      throw err; // tells the form to stop showing "saving"
    }
  }

  return (
    <>
      <h1 className="page-title">Add a book</h1>
      {saveError && <p className="error-text" role="alert">{saveError}</p>}
      <BookForm
        submitLabel="SAVE BOOK"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/books")}
      />
    </>
  );
}

export default function AddBookPage() {
  return (
    <div className="container narrow">
      <RequireAuth>
        <AddBook />
      </RequireAuth>
    </div>
  );
}
