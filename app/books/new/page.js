"use client";

import { useRouter } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import BookForm from "@/components/BookForm";
import { useBooks } from "@/components/BooksProvider";

function AddBook() {
  const router = useRouter();
  const { addBook } = useBooks();

  return (
    <>
      <h1 className="page-title">Add a book</h1>
      <BookForm
        submitLabel="SAVE BOOK"
        onSubmit={(fields) => {
          const book = addBook(fields);
          router.push(`/books/${book.id}`);
        }}
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
