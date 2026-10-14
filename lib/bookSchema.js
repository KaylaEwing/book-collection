// Checking and converting book data.
//
// This file has no Supabase or React code in it on purpose: it is plain
// functions, so it can be unit tested on its own and used on both the browser
// side and the server side. The API routes check every request with
// validateBook before anything reaches the database.

export const STATUS_VALUES = ["want", "reading", "read"];
export const TITLE_MAX = 200;
export const AUTHOR_MAX = 200;
export const NOTES_MAX = 500;

const asText = (value) => (typeof value === "string" ? value.trim() : "");

// Returns { valid, errors, values }. errors is keyed by field name so the
// form can show each message next to the right input.
export function validateBook(input, { partial = false } = {}) {
  const errors = {};
  const values = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(input ?? {}, key);

  if (!partial || has("title")) {
    const title = asText(input?.title);
    if (!title) errors.title = "Enter the book's title.";
    else if (title.length > TITLE_MAX) errors.title = `Keep the title under ${TITLE_MAX} characters.`;
    else values.title = title;
  }

  if (!partial || has("author")) {
    const author = asText(input?.author);
    if (!author) errors.author = "Enter the author's name.";
    else if (author.length > AUTHOR_MAX) errors.author = `Keep the author under ${AUTHOR_MAX} characters.`;
    else values.author = author;
  }

  if (!partial || has("status")) {
    const status = asText(input?.status) || "want";
    if (!STATUS_VALUES.includes(status)) errors.status = "Choose a reading status.";
    else values.status = status;
  }

  if (!partial || has("rating")) {
    const raw = input?.rating;
    if (raw === null || raw === undefined || raw === "") {
      values.rating = null;
    } else {
      const rating = Number(raw);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.rating = "Ratings run from 1 to 5.";
      } else {
        values.rating = rating;
      }
    }
  }

  if (!partial || has("notes")) {
    const notes = asText(input?.notes);
    if (notes.length > NOTES_MAX) errors.notes = `Keep notes under ${NOTES_MAX} characters.`;
    else values.notes = notes;
  }

  if (!partial || has("cover")) {
    const cover = input?.cover;
    if (!cover || !cover.url) {
      values.cover_url = null;
      values.cover_width = null;
      values.cover_height = null;
    } else if (typeof cover.url !== "string" || !/^https?:\/\//.test(cover.url)) {
      errors.cover = "The cover picture couldn't be saved. Try choosing it again.";
    } else {
      values.cover_url = cover.url;
      values.cover_width = Number(cover.width) || null;
      values.cover_height = Number(cover.height) || null;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, values };
}

// Database row -> the shape the React components already expect.
export function rowToBook(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    author: row.author,
    status: row.status,
    rating: row.rating ?? null,
    notes: row.notes ?? "",
    cover: row.cover_url
      ? { url: row.cover_url, width: row.cover_width, height: row.cover_height }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Where one user's cover pictures live in the storage bucket. Keeping each
// user's files under their own id is what the storage policy checks.
export function coverPath(userId, fileName) {
  const safe = fileName.replace(/[^a-z0-9.-]/gi, "-").toLowerCase();
  return `${userId}/${Date.now()}-${safe}`;
}
