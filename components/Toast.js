"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import styles from "./Toast.module.css";

// A small message that appears at the bottom of the screen after an action,
// with an optional button (used for "Undo" after deleting a book).
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const showToast = useCallback((message, action) => {
    clearTimeout(timer.current);
    setToast({ message, action });
    timer.current = setTimeout(() => setToast(null), 8000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={{ showToast, hide }}>
      {children}
      {/* aria-live lets screen readers announce the message */}
      <div className={styles.region} role="status" aria-live="polite">
        {toast && (
          <div className={styles.toast}>
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action.onClick();
                  hide();
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" className={styles.close} onClick={hide} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
