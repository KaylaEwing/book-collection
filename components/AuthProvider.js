"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { makeId } from "@/lib/books";

// TEMPORARY front-end-only accounts, saved in the browser.
// This will be replaced by Supabase Auth when the backend is added.
// Passwords are NOT saved here; any password works for a registered username.
const USERS_KEY = "bookcollection-users";
const SESSION_KEY = "bookcollection-session";

const AuthContext = createContext(null);

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode); the app still works for this visit.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readJSON(SESSION_KEY, null));
    setReady(true);
  }, []);

  function register(username) {
    const name = username.trim();
    const users = readJSON(USERS_KEY, []);
    if (users.some((u) => u.username.toLowerCase() === name.toLowerCase())) {
      return { error: "That username is taken. Try a different one or log in." };
    }
    const newUser = { id: makeId(), username: name };
    writeJSON(USERS_KEY, [...users, newUser]);
    writeJSON(SESSION_KEY, newUser);
    setUser(newUser);
    return { user: newUser };
  }

  function login(username) {
    const users = readJSON(USERS_KEY, []);
    const found = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!found) {
      return { error: "No account uses that username. Check the spelling or register." };
    }
    writeJSON(SESSION_KEY, found);
    setUser(found);
    return { user: found };
  }

  function logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
