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

  function save(next) {
    setBooks(next);
    if (!user) return;
    try {
      localStorage.setItem(keyFor(user.id), JSON.stringify(next));
    } catch {}
  }

  function addBook(fields) {
    const now = new Date().toISOString();
    const book = { id: makeId(), userId: user.id, ...fields, createdAt: now, updatedAt: now };
    save([book, ...books]);
    return book;
  }

  function updateBook(id, fields) {
    const now = new Date().toISOString();
    save(books.map((b) => (b.id === id ? { ...b, ...fields, updatedAt: now } : b)));
  }

  function deleteBook(id) {
    save(books.filter((b) => b.id !== id));
  }

  function getBook(id) {
    return books.find((b) => b.id === id) ?? null;
  }

  return (
    <BooksContext.Provider value={{ books, loaded, addBook, updateBook, deleteBook, getBook }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  return useContext(BooksContext);
}
