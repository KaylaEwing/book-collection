"use client";

import { useRef, useState } from "react";
import { formatBytes, makeCover } from "@/lib/images";
import styles from "./CoverPicker.module.css";

// Lets someone choose a cover picture. The picture is shrunk in the browser
// before it is saved, and the before/after sizes are shown so it's clear
// what happened.
export default function CoverPicker({ value, onChange }) {
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
      const cover = await makeCover(file);
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
        {value?.dataUrl ? (
          <img
            src={value.dataUrl}
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
            {busy ? "WORKING…" : value?.dataUrl ? "CHANGE" : "CHOOSE IMAGE"}
          </button>
          {value?.dataUrl && (
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
          `Shrunk from ${formatBytes(saved.from)} to ${formatBytes(saved.to)} before saving.`
        ) : value?.dataUrl ? (
          `Saved at ${value.width} × ${value.height} pixels (${formatBytes(value.bytes ?? 0)}).`
        ) : (
          ""
        )}
      </p>
    </div>
  );
}
