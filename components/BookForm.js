"use client";

import { useState } from "react";
import { STATUSES } from "@/lib/books";

const EMPTY = { title: "", author: "", status: "want", rating: "", notes: "" };
const NOTES_MAX = 500;

// Shared form for Add Book and Edit Book.
export default function BookForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(() =>
    initial
      ? { ...EMPTY, ...initial, rating: initial.rating ? String(initial.rating) : "" }
      : EMPTY
  );
  const [errors, setErrors] = useState({});

  function update(e) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!values.title.trim()) found.title = "Enter the book's title.";
    if (!values.author.trim()) found.author = "Enter the author's name.";
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }

    onSubmit({
      title: values.title.trim(),
      author: values.author.trim(),
      status: values.status,
      rating: values.rating ? Number(values.rating) : null,
      notes: values.notes.trim(),
    });
  }

  const describe = (name) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 20, marginTop: 28 }}>
      <div className="field">
        <label htmlFor="title" className="field-label">Title</label>
        <input id="title" name="title" className="input" value={values.title} onChange={update}
          aria-invalid={errors.title ? "true" : undefined} aria-describedby={describe("title")} />
        {errors.title && <span id="title-error" className="error-text">{errors.title}</span>}
      </div>

      <div className="field">
        <label htmlFor="author" className="field-label">Author</label>
        <input id="author" name="author" className="input" value={values.author} onChange={update}
          aria-invalid={errors.author ? "true" : undefined} aria-describedby={describe("author")} />
        {errors.author && <span id="author-error" className="error-text">{errors.author}</span>}
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="field">
          <label htmlFor="status" className="field-label">Reading status</label>
          <select id="status" name="status" className="select" value={values.status} onChange={update}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="rating" className="field-label">Rating</label>
          <select id="rating" name="rating" className="select" value={values.rating} onChange={update}>
            <option value="">Not rated</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{"★".repeat(n)} ({n} of 5)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes" className="field-label">Notes</label>
        <span id="notes-hint" className="field-hint">Optional. Thoughts, quotes, or who recommended it.</span>
        <textarea id="notes" name="notes" className="textarea" maxLength={NOTES_MAX} value={values.notes}
          onChange={update} aria-describedby="notes-hint notes-count" />
        <span id="notes-count" className="field-hint" aria-live="polite">
          {values.notes.length} of {NOTES_MAX} characters
        </span>
      </div>

      <div className="button-row">
        <button type="submit" className="btn-light">{submitLabel}</button>
        <button type="button" className="btn-light btn-light-outline" onClick={onCancel}>
          CANCEL
        </button>
      </div>
    </form>
  );
}
