// Shared helpers for the browser tests.
//
// Accounts now live in Supabase, so these tests need a configured project to
// run against. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// in .env.local first. Without them the whole suite is skipped with a message
// rather than failing forty times over.
import { test, expect } from "@playwright/test";

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Call at the top of any test file that needs a real database.
export function requireDatabase() {
  test.skip(
    !supabaseConfigured,
    "Supabase is not configured. Copy .env.example to .env.local and fill it in."
  );
}

// Supabase accounts are permanent, so every run needs a fresh email address.
export function uniqueAccount(label = "test") {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return {
    username: `${label}${stamp.slice(-6)}`,
    email: `${label}.${stamp}@example.com`,
    password: "password123",
  };
}

// Registers a brand new account and waits until the collection page loads.
export async function signUp(page, label = "test") {
  const account = uniqueAccount(label);
  await page.goto("/register");
  await page.fill("#username", account.username);
  await page.fill("#email", account.email);
  await page.fill("#password", account.password);
  await page.fill("#confirm", account.password);
  await page.getByRole("button", { name: "REGISTER" }).click();
  await page.waitForURL(/\/books$/, { timeout: 20000 });
  return account;
}

// Logs an existing account back in.
export async function logIn(page, account) {
  await page.goto("/login");
  await page.fill("#email", account.email);
  await page.fill("#password", account.password);
  await page.getByRole("button", { name: "LOG IN" }).click();
  await page.waitForURL(/\/books$/, { timeout: 20000 });
}

// Adds a book through the form and waits for its detail page.
export async function addBook(page, title, author, status = "want", rating = "") {
  await page.goto("/books/new");
  await page.fill("#title", title);
  await page.fill("#author", author);
  await page.selectOption("#status", status);
  await page.selectOption("#rating", rating);
  await page.getByRole("button", { name: "SAVE BOOK" }).click();
  // "**/books/*" would also match /books/new, so exclude it
  await page.waitForURL(/\/books\/(?!new)[^/]+$/, { timeout: 20000 });
}

export { test, expect };
