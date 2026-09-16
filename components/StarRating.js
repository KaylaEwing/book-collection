// Shows a 1–5 rating as stars, or "Not rated".
export default function StarRating({ value }) {
  if (!value) return <span style={{ opacity: 0.7 }}>Not rated</span>;
  return (
    <span aria-label={`${value} out of 5 stars`} style={{ letterSpacing: 2, color: "#b8860b" }}>
      <span aria-hidden="true">{"★".repeat(value)}{"☆".repeat(5 - value)}</span>
    </span>
  );
}
