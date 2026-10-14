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
