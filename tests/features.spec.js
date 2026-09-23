// Feature tests for the CRUD pages and this week's new features.
import { test, expect } from "@playwright/test";

async function signIn(page, username) {
  await page.goto("/register");
  await page.fill("#username", username);
  await page.fill("#password", "password123");
  await page.fill("#confirm", "password123");
  await page.getByRole("button", { name: "REGISTER" }).click();
  await page.waitForURL("**/books");
}

async function addBook(page, title, author, status = "want", rating = "") {
  await page.goto("/books/new");
  await page.fill("#title", title);
  await page.fill("#author", author);
  await page.selectOption("#status", status);
  await page.selectOption("#rating", rating);
  await page.getByRole("button", { name: "SAVE BOOK" }).click();
  // "**/books/*" also matches /books/new, so match the detail page exactly
  await page.waitForURL(/\/books\/(?!new)[^/]+$/);
}

test("book pages are private until you log in", async ({ page }) => {
  await page.goto("/books");
  await expect(page.getByText("Log in to see your books")).toBeVisible();
});

test("a book can be created, edited, and deleted", async ({ page }) => {
  await signIn(page, "crud1");

  await addBook(page, "Dracula", "Bram Stoker", "read", "4");
  await expect(page.getByRole("heading", { name: "Dracula" })).toBeVisible();

  await page.getByRole("link", { name: "Edit book" }).click();
  await expect(page.locator("#title")).toHaveValue("Dracula");
  await page.fill("#title", "Dracula (Annotated)");
  await page.getByRole("button", { name: "SAVE CHANGES" }).click();
  await expect(page.getByRole("heading", { name: "Dracula (Annotated)" })).toBeVisible();

  await page.getByRole("button", { name: "Delete book" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Delete book" }).click();
  await page.waitForURL(/\/books$/);
  // Look inside the list only; the "was deleted" message also has the title
  await expect(page.getByTestId("book-grid").getByText("Dracula (Annotated)")).toHaveCount(0);
});

test("undo puts a deleted book back", async ({ page }) => {
  await signIn(page, "undo1");
  await addBook(page, "Persuasion", "Jane Austen");

  await page.getByRole("button", { name: "Delete book" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete book" }).click();
  await page.waitForURL("**/books");

  await page.getByRole("button", { name: "Undo" }).click();
  // Exactly one card, so Undo can't add a duplicate
  await expect(page.getByTestId("book-grid").getByText("Persuasion")).toHaveCount(1);
});

test("the reading status can be changed in one click", async ({ page }) => {
  await signIn(page, "status1");
  await addBook(page, "Emma", "Jane Austen", "want");

  await page.getByRole("button", { name: "Reading", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reading", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.goto("/books?status=reading");
  await expect(page.getByText("Emma")).toBeVisible();
});

test("search and filters are saved in the address bar", async ({ page }) => {
  await signIn(page, "filter1");
  await addBook(page, "Beowulf", "Unknown", "read");

  await page.goto("/books");
  await page.fill("#search", "beowulf");
  await expect(page).toHaveURL(/q=beowulf/);

  await page.reload();
  await expect(page.locator("#search")).toHaveValue("beowulf");

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("#search")).toHaveValue("");
});

test("required fields are checked before saving", async ({ page }) => {
  await signIn(page, "valid1");
  await page.goto("/books/new");
  await page.getByRole("button", { name: "SAVE BOOK" }).click();
  await expect(page.getByText("Enter the book's title.")).toBeVisible();
  await expect(page.getByText("Enter the author's name.")).toBeVisible();
});

test("the reading summary counts books correctly", async ({ page }) => {
  await signIn(page, "stats1");

  const finished = page.locator("dt", { hasText: "Finished" }).locator("xpath=following-sibling::dd[1]");
  await page.goto("/books");
  const before = Number(await finished.textContent()); // new accounts start with sample books

  await addBook(page, "Book One", "Author One", "read", "5");
  await addBook(page, "Book Two", "Author Two", "reading");

  await page.goto("/books");
  await expect(finished).toHaveText(String(before + 1));
});
