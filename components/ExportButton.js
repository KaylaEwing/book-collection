"use client";

import { useBooks } from "./BooksProvider";
import { useToast } from "./Toast";

// Saves the collection to a JSON file on the user's computer.
// Useful right now because books live in the browser, so this is the only
// way to keep a copy or move them to another computer.
export default function ExportButton({ className = "btn-light btn-light-outline" }) {
  const { books } = useBooks();
  const { showToast } = useToast();

  function handleExport() {
    const data = {
      exportedAt: new Date().toISOString(),
      bookCount: books.length,
      books,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `book-collection-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast(`Saved ${books.length} ${books.length === 1 ? "book" : "books"} to a file.`);
  }

  return (
    <button type="button" className={className} onClick={handleExport} disabled={books.length === 0}>
      EXPORT
    </button>
  );
}
