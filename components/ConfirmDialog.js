"use client";

import { useEffect, useRef } from "react";

// Asks before deleting. Uses the built-in <dialog> element,
// which handles focus and the Escape key.
export default function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirm-title"
      style={{
        border: "none",
        borderRadius: 8,
        padding: 28,
        maxWidth: 440,
        width: "calc(100% - 32px)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <h2 id="confirm-title" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 28 }}>
        {title}
      </h2>
      <p style={{ marginTop: 12, fontSize: 17, lineHeight: 1.5 }}>{message}</p>
      <div className="button-row">
        <button type="button" className="btn-dark" onClick={onConfirm}>{confirmLabel}</button>
        <button type="button" className="btn-outline" onClick={onCancel} autoFocus>
          Keep it
        </button>
      </div>
    </dialog>
  );
}
