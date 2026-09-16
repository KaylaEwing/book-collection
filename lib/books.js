// Shared book settings and sample data.
// The book fields match the data model in the project proposal.

export const STATUSES = [
  { value: "want", label: "Want to read" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
];

export function statusLabel(value) {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}

export const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "title", label: "Title (A–Z)" },
  { value: "author", label: "Author (A–Z)" },
  { value: "rating", label: "Highest rated" },
];

// A few books so a new account has something to look at.
export function sampleBooks(userId) {
  const now = new Date().toISOString();
  return [
    { title: "Pride and Prejudice", author: "Jane Austen", status: "read", rating: 5, notes: "Loved Elizabeth's wit." },
    { title: "The Hobbit", author: "J.R.R. Tolkien", status: "reading", rating: null, notes: "" },
    { title: "Little Women", author: "Louisa May Alcott", status: "want", rating: null, notes: "Recommended by my sister." },
  ].map((book, i) => ({
    id: `sample-${i + 1}`,
    userId,
    ...book,
    createdAt: now,
    updatedAt: now,
  }));
}

export function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
