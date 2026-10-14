// Unit tests for the validation that guards every API route.
// These need no database and no browser: run them with `npm run test:unit`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBook, rowToBook, coverPath, NOTES_MAX } from "../../lib/bookSchema.js";

const good = { title: "Dracula", author: "Bram Stoker", status: "read", rating: 4, notes: "Liked it." };

test("accepts a complete, valid book", () => {
  const { valid, errors, values } = validateBook(good);
  assert.equal(valid, true);
  assert.deepEqual(errors, {});
  assert.equal(values.title, "Dracula");
  assert.equal(values.rating, 4);
});

test("trims whitespace around the title and author", () => {
  const { values } = validateBook({ ...good, title: "  Dracula  ", author: " Bram Stoker " });
  assert.equal(values.title, "Dracula");
  assert.equal(values.author, "Bram Stoker");
});

test("requires a title and an author", () => {
  const { valid, errors } = validateBook({ title: "   ", author: "" });
  assert.equal(valid, false);
  assert.match(errors.title, /title/i);
  assert.match(errors.author, /author/i);
});

test("rejects a reading status that is not one of the three", () => {
  const { valid, errors } = validateBook({ ...good, status: "finished" });
  assert.equal(valid, false);
  assert.ok(errors.status);
});

test("defaults the status to 'want' when none is given", () => {
  const { values } = validateBook({ title: "A", author: "B" });
  assert.equal(values.status, "want");
});

test("accepts ratings 1 to 5 and rejects anything else", () => {
  for (const rating of [1, 2, 3, 4, 5]) {
    assert.equal(validateBook({ ...good, rating }).valid, true, `rating ${rating} should be valid`);
  }
  for (const rating of [0, 6, -1, 2.5, "high"]) {
    assert.equal(validateBook({ ...good, rating }).valid, false, `rating ${rating} should be invalid`);
  }
});

test("treats an empty rating as 'not rated' rather than an error", () => {
  for (const rating of ["", null, undefined]) {
    const { valid, values } = validateBook({ ...good, rating });
    assert.equal(valid, true);
    assert.equal(values.rating, null);
  }
});

test("rejects notes longer than the limit", () => {
  assert.equal(validateBook({ ...good, notes: "x".repeat(NOTES_MAX) }).valid, true);
  assert.equal(validateBook({ ...good, notes: "x".repeat(NOTES_MAX + 1) }).valid, false);
});

test("partial mode only checks the fields that were sent", () => {
  // An edit that changes just the status must not complain about the title.
  const { valid, values } = validateBook({ status: "reading" }, { partial: true });
  assert.equal(valid, true);
  assert.deepEqual(Object.keys(values), ["status"]);
});

test("partial mode still rejects a bad value", () => {
  const { valid, errors } = validateBook({ status: "nope" }, { partial: true });
  assert.equal(valid, false);
  assert.ok(errors.status);
});

test("rejects a cover url that is not a real web address", () => {
  const { valid, errors } = validateBook({ ...good, cover: { url: "javascript:alert(1)" } });
  assert.equal(valid, false);
  assert.ok(errors.cover);
});

test("accepts a cover and keeps its dimensions", () => {
  const cover = { url: "https://example.supabase.co/storage/v1/cover.webp", width: 400, height: 600 };
  const { valid, values } = validateBook({ ...good, cover });
  assert.equal(valid, true);
  assert.equal(values.cover_url, cover.url);
  assert.equal(values.cover_width, 400);
  assert.equal(values.cover_height, 600);
});

test("clearing the cover stores nulls, not undefined", () => {
  const { values } = validateBook({ ...good, cover: null });
  assert.equal(values.cover_url, null);
  assert.equal(values.cover_width, null);
  assert.equal(values.cover_height, null);
});

test("never lets a client set user_id or id", () => {
  const { values } = validateBook({ ...good, id: "evil", user_id: "someone-else" });
  assert.equal(values.id, undefined);
  assert.equal(values.user_id, undefined);
});

test("rowToBook turns a database row into the shape the components expect", () => {
  const row = {
    id: "abc",
    user_id: "user-1",
    title: "Dracula",
    author: "Bram Stoker",
    status: "read",
    rating: 4,
    notes: null,
    cover_url: "https://example.com/c.webp",
    cover_width: 400,
    cover_height: 600,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-02T00:00:00Z",
  };
  const book = rowToBook(row);
  assert.equal(book.userId, "user-1");
  assert.equal(book.notes, ""); // null becomes an empty string for the form
  assert.deepEqual(book.cover, { url: row.cover_url, width: 400, height: 600 });
  assert.equal(book.updatedAt, row.updated_at);
});

test("rowToBook reports no cover as null, not a broken object", () => {
  const book = rowToBook({ id: "a", user_id: "u", title: "T", author: "A", status: "want", cover_url: null });
  assert.equal(book.cover, null);
});

test("coverPath puts the file under the user's own folder", () => {
  const path = coverPath("user-123", "My Photo.WEBP");
  assert.ok(path.startsWith("user-123/"), `expected a user-123/ prefix, got ${path}`);
  assert.ok(!/\s/.test(path), "the path should not contain spaces");
});

test("coverPath strips characters that could escape the folder", () => {
  const path = coverPath("user-123", "../../etc/passwd");
  const [folder] = path.split("/");
  assert.equal(folder, "user-123");
  assert.equal(path.split("/").length, 2, `expected one folder level, got ${path}`);
});
