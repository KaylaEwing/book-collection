"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/images";
import { uploadCover } from "@/lib/covers";
import { useAuth } from "./AuthProvider";
import styles from "./CoverPicker.module.css";

// Lets someone choose a cover picture. The picture is shrunk in the browser
// before it is saved, and the before/after sizes are shown so it's clear
// what happened.
export default function CoverPicker({ value, onChange }) {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setBusy(true);
    try {
      // Shrink in the browser, then upload to Supabase Storage
      const cover = await uploadCover(file, user.id);
      onChange(cover);
      setSaved({ from: cover.originalBytes, to: cover.bytes });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      event.target.value = ""; // lets the same file be picked again
    }
  }

  function remove() {
    onChange(null);
    setSaved(null);
    setError("");
  }

  return (
    <div className="field">
      <span className="field-label" id="cover-label">Cover picture</span>
      <span id="cover-hint" className="field-hint">
        Optional. Large photos are shrunk automatically so the page stays fast.
      </span>

      <div className={styles.row}>
        {value?.url ? (
          <img
            src={value.url}
            alt="Selected cover preview"
            width={value.width}
            height={value.height}
            className={styles.preview}
            data-testid="cover-preview"
          />
        ) : (
          <span className={styles.empty} aria-hidden="true">No cover</span>
        )}

        <div className={styles.buttons}>
          <input
            ref={inputRef}
            id="cover"
            type="file"
            accept="image/*"
            className={styles.input}
            aria-labelledby="cover-label"
            aria-describedby="cover-hint"
            onChange={handleFile}
          />
          <button
            type="button"
            className="btn-light btn-light-outline"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? "UPLOADING…" : value?.url ? "CHANGE" : "CHOOSE IMAGE"}
          </button>
          {value?.url && (
            <button type="button" className="btn-light btn-light-outline" onClick={remove}>
              REMOVE
            </button>
          )}
        </div>
      </div>

      <p className={styles.note} aria-live="polite">
        {error ? (
          <span className="error-text">{error}</span>
        ) : saved ? (
          `Shrunk from ${formatBytes(saved.from)} to ${formatBytes(saved.to)} and uploaded.`
        ) : value?.url ? (
          `Saved at ${value.width} × ${value.height} pixels (${formatBytes(value.bytes ?? 0)}).`
        ) : (
          ""
        )}
      </p>
    </div>
  );
}
