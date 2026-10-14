"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useToast } from "./Toast";

// The collection now lives in the database. Every function here calls one of
// the API routes under /api/books, which run the query as the signed-in user.
//
// Each change is applied to the screen first and then saved. If the save
// fails, the change is rolled back and a message explains what happened, so
// the list never shows something the database didn't accept.
const BooksContext = createContext(null);

async function request(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // An empty or non-JSON body, for example when the server is unreachable
  }

  if (!response.ok) {
    const error = new Error(payload?.error ?? "Something went wrong. Please try again.");
    error.status = response.status;
    error.fieldErrors = payload?.errors ?? null;
    throw error;
  }
  return payload;
}

export function BooksProvider({ children }) {
  const { user, ready: authReady } = useAuth();
  const { showToast } = useToast();
  const [books, setBooks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    // Nothing to fetch without a database connection or a signed-in user.
    if (!isSupabaseConfigured() || !user) {
      setBooks([]);
      setLoaded(true);
      return;
    }
    setError("");
    try {
      const { books: rows } = await request("/api/books");
      setBooks(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (!authReady) return;
    setLoaded(false);
    refresh();
  }, [authReady, refresh]);

  async function addBook(fields) {
    const { book } = await request("/api/books", {
      method: "POST",
      body: JSON.stringify(fields),
    });
    setBooks((current) => [book, ...current]);
    return book;
  }

  async function updateBook(id, fields) {
    const previous = books;
    // Show the change straight away so the page doesn't feel sluggish
    setBooks((current) =>
      current.map((b) => (b.id === id ? { ...b, ...fields, updatedAt: new Date().toISOString() } : b))
    );

    try {
      const { book } = await request(`/api/books/${id}`, {
        method: "PATCH",
        body: JSON.stringify(fields),
      });
      setBooks((current) => current.map((b) => (b.id === id ? book : b)));
      return book;
    } catch (err) {
      setBooks(previous); // put it back the way it was
      showToast(err.message);
      throw err;
    }
  }

  async function deleteBook(id) {
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) return null;
    const previous = books;

    setBooks((current) => current.filter((b) => b.id !== id));

    try {
      const { book } = await request(`/api/books/${id}`, { method: "DELETE" });
      return { book, index };
    } catch (err) {
      setBooks(previous);
      showToast(err.message);
      throw err;
    }
  }

  // Undo after a delete: the book is written back to the database with the
  // same details, and put back where it was in the list.
  async function restoreBook(book, index) {
    try {
      const { book: saved } = await request("/api/books", {
        method: "POST",
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          status: book.status,
          rating: book.rating,
          notes: book.notes,
          cover: book.cover,
        }),
      });
      setBooks((current) => {
        if (current.some((b) => b.id === saved.id)) return current;
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, saved);
        return next;
      });
      return saved;
    } catch (err) {
      showToast("That book couldn't be restored. Please add it again.");
      throw err;
    }
  }

  function getBook(id) {
    return books.find((b) => b.id === id) ?? null;
  }

  return (
    <BooksContext.Provider
      value={{ books, loaded, error, refresh, addBook, updateBook, deleteBook, restoreBook, getBook }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  return useContext(BooksContext);
}
