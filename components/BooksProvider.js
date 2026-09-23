"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { makeId, sampleBooks } from "@/lib/books";

// TEMPORARY book storage in the browser, one list per user.
// Each function here maps to a Supabase call later:
// addBook -> insert, updateBook -> update, deleteBook -> delete, books -> select.
const BooksContext = createContext(null);

const keyFor = (userId) => `bookcollection-books-${userId}`;

export function BooksProvider({ children }) {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (!user) {
      setBooks([]);
      return;
    }
    let stored = null;
    try {
      const raw = localStorage.getItem(keyFor(user.id));
      stored = raw ? JSON.parse(raw) : null;
    } catch {}
    setBooks(stored ?? sampleBooks(user.id));
    setLoaded(true);
  }, [user]);

  // Takes a function so every change is based on the newest list, not on a
  // copy captured earlier. This is what stopped Undo from adding duplicates.
  function save(updater) {
    setBooks((current) => {
      const next = updater(current);
      if (user) {
        try {
          localStorage.setItem(keyFor(user.id), JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }

  function addBook(fields) {
    const now = new Date().toISOString();
    const book = { id: makeId(), userId: user.id, ...fields, createdAt: now, updatedAt: now };
    save((current) => [book, ...current]);
    return book;
  }

  function updateBook(id, fields) {
    const now = new Date().toISOString();
    save((current) => current.map((b) => (b.id === id ? { ...b, ...fields, updatedAt: now } : b)));
  }

  // Returns the deleted book and its position so it can be put back (Undo)
  function deleteBook(id) {
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) return null;
    const removed = books[index];
    save((current) => current.filter((b) => b.id !== id));
    return { book: removed, index };
  }

  function restoreBook(book, index) {
    save((current) => {
      // Don't add it twice if Undo is somehow clicked more than once
      if (current.some((b) => b.id === book.id)) return current;
      const next = [...current];
      next.splice(Math.min(index, next.length), 0, book);
      return next;
    });
  }

  function getBook(id) {
    return books.find((b) => b.id === id) ?? null;
  }

  return (
    <BooksContext.Provider value={{ books, loaded, addBook, updateBook, deleteBook, restoreBook, getBook }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  return useContext(BooksContext);
}
