// Feature tests for the CRUD pages and this week's new features.
import { test, expect, signUp, addBook, requireDatabase } from "./helpers.js";

// Every test here signs up a real account, so a configured database is required.
requireDatabase();

test("book pages are private until you log in", async ({ page }) => {
  await page.goto("/books");
  await expect(page.getByText("Log in to see your books")).toBeVisible();
});

test("a book can be created, edited, and deleted", async ({ page }) => {
  await signUp(page, "crud1");

  await addBook(page, "Dracula", "Bram Stoker", "read", "4");
  await expect(page.getByRole("heading", { name: "Dracula" })).toBeVisible();

  await page.getByRole("link", { name: "Edit book" }).click();
  await page.waitForURL(/\/edit$/);
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
  await signUp(page, "undo1");
  await addBook(page, "Persuasion", "Jane Austen");

  await page.getByRole("button", { name: "Delete book" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete book" }).click();
  await page.waitForURL("**/books");

  await page.getByRole("button", { name: "Undo" }).click();
  // Exactly one card, so Undo can't add a duplicate
  await expect(page.getByTestId("book-grid").getByText("Persuasion")).toHaveCount(1);
});

test("the reading status can be changed in one click", async ({ page }) => {
  await signUp(page, "status1");
  await addBook(page, "Emma", "Jane Austen", "want");

  await page.getByRole("button", { name: "Reading", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reading", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.goto("/books?status=reading");
  await expect(page.getByText("Emma")).toBeVisible();
});

test("search and filters are saved in the address bar", async ({ page }) => {
  await signUp(page, "filter1");
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
  await signUp(page, "valid1");
  await page.goto("/books/new");
  await page.getByRole("button", { name: "SAVE BOOK" }).click();
  await expect(page.getByText("Enter the book's title.")).toBeVisible();
  await expect(page.getByText("Enter the author's name.")).toBeVisible();
});

test("the reading summary counts books correctly", async ({ page }) => {
  await signUp(page, "stats1");

  const finished = page.locator("dt", { hasText: "Finished" }).locator("xpath=following-sibling::dd[1]");
  await page.goto("/books");
  const before = Number(await finished.textContent()); // new accounts start with sample books

  await addBook(page, "Book One", "Author One", "read", "5");
  await addBook(page, "Book Two", "Author Two", "reading");

  await page.goto("/books");
  await expect(finished).toHaveText(String(before + 1));
});

test("the collection can be exported to a file", async ({ page }) => {
  await signUp(page, "exportuser");
  await addBook(page, "Exported Book", "Some Author", "read", "5");
  await page.goto("/books");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "EXPORT" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^book-collection-\d{4}-\d{2}-\d{2}\.json$/);

  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const data = JSON.parse(Buffer.concat(chunks).toString());

  expect(data.bookCount).toBe(data.books.length);
  expect(data.books.some((b) => b.title === "Exported Book")).toBe(true);
});

test("notes are limited to 500 characters", async ({ page }) => {
  await signUp(page, "notesuser");
  await page.goto("/books/new");
  await page.fill("#notes", "x".repeat(600));
  await expect(page.locator("#notes")).toHaveValue("x".repeat(500));
  await expect(page.getByText("500 of 500 characters")).toBeVisible();
});

test("each user only sees their own books", async ({ page }) => {
  await signUp(page, "userone");
  await addBook(page, "Private Book", "Only Mine");
  await page.getByRole("button", { name: "Log out" }).click();

  await signUp(page, "usertwo");
  await expect(page.getByTestId("book-grid").getByText("Private Book")).toHaveCount(0);
});
