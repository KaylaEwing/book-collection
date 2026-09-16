"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import StarRating from "@/components/StarRating";
import { useBooks } from "@/components/BooksProvider";
import { STATUSES, SORT_OPTIONS, statusLabel } from "@/lib/books";
import styles from "./books.module.css";

function BookList() {
  const { books, loaded } = useBooks();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("updated");

  const counts = useMemo(() => {
    const c = { all: books.length };
    STATUSES.forEach((s) => (c[s.value] = books.filter((b) => b.status === s.value).length));
    return c;
  }, [books]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = books.filter(
      (b) =>
        (status === "all" || b.status === status) &&
        (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    );
    const sorters = {
      updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      title: (a, b) => a.title.localeCompare(b.title),
      author: (a, b) => a.author.localeCompare(b.author),
      rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    };
    return [...list].sort(sorters[sort]);
  }, [books, query, status, sort]);

  if (!loaded) return <p className="status-text">Loading your books…</p>;

  const tabs = [{ value: "all", label: "All" }, ...STATUSES];

  return (
    <>
      <div className={styles.header}>
        <h1 className="page-title">My Books</h1>
        <Link href="/books/new" className="btn-light">ADD A BOOK</Link>
      </div>

      {/* Status filter with counts */}
      <div className={styles.tabs} role="group" aria-label="Filter by reading status">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            className={styles.tab}
            aria-pressed={status === t.value}
            onClick={() => setStatus(t.value)}
          >
            {t.label} <span className={styles.count}>{counts[t.value]}</span>
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <div className="field">
          <label htmlFor="search" className="field-label">Search</label>
          <input
            id="search"
            type="search"
            className="input"
            placeholder="Title or author"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="sort" className="field-label">Sort by</label>
          <select id="sort" className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className={styles.resultCount} aria-live="polite">
        Showing {shown.length} of {books.length} {books.length === 1 ? "book" : "books"}
      </p>

      {books.length === 0 ? (
        <div className="panel center">
          <h2 className="page-title">Your list is empty</h2>
          <p className="lead">Add the book you're reading now, or one you want to read next.</p>
          <div className="button-row center-row">
            <Link href="/books/new" className="btn-dark">Add a book</Link>
          </div>
        </div>
      ) : shown.length === 0 ? (
        <div className="panel center">
          <p className="lead">No books match. Try a different search or choose All.</p>
        </div>
      ) : (
        <ul className={styles.grid}>
          {shown.map((book) => (
            <li key={book.id}>
              <Link href={`/books/${book.id}`} className={styles.card}>
                <span className={`${styles.badge} ${styles[book.status]}`}>
                  {statusLabel(book.status)}
                </span>
                <span className={styles.title}>{book.title}</span>
                <span className={styles.author}>{book.author}</span>
                <StarRating value={book.rating} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function BooksPage() {
  return (
    <div className="container">
      <RequireAuth>
        <BookList />
      </RequireAuth>
    </div>
  );
}
