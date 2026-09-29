// Page-by-page checks: every page loads, has one main heading, and the
// navigation links go where they say they go.
import { test, expect } from "@playwright/test";

async function signIn(page, username) {
  await page.goto("/register");
  await page.fill("#username", username);
  await page.fill("#password", "password123");
  await page.fill("#confirm", "password123");
  await page.getByRole("button", { name: "REGISTER" }).click();
  await page.waitForURL(/\/books$/);
}

const GUEST_PAGES = [
  { path: "/", heading: "WELCOME!" },
  { path: "/login", heading: "Log in" },
  { path: "/register", heading: "Create an account" },
  { path: "/about", heading: "About this project" },
];

test.describe("pages load for visitors", () => {
  for (const { path, heading } of GUEST_PAGES) {
    test(`${path} loads with its heading`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });
  }
});

test("an unknown address shows the not found page", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "HOME" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("navigation links work for a visitor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation").getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);

  await page.getByRole("navigation").getByRole("link", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("link", { name: "Let’s read together" }).click();
  await expect(page).toHaveURL(/\/register$/);

  await page.getByRole("link", { name: "Kayla Ewing" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("navigation links work for a logged-in user", async ({ page }) => {
  await signIn(page, "navuser");

  await page.getByRole("navigation").getByRole("link", { name: "Add a Book" }).click();
  await expect(page).toHaveURL(/\/books\/new$/);

  await page.getByRole("navigation").getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\/about$/);

  await page.getByRole("navigation").getByRole("link", { name: "My Books" }).click();
  await expect(page).toHaveURL(/\/books$/);
});

test("the current page is marked in the navigation", async ({ page }) => {
  await signIn(page, "currentuser");
  await page.goto("/about");
  await expect(page.getByRole("navigation").getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
});

test("page titles change between pages", async ({ page }) => {
  await page.goto("/register");
  await expect(page).toHaveTitle(/Register/);
  await page.goto("/about");
  await expect(page).toHaveTitle(/About/);
});

test("every form field has a label", async ({ page }) => {
  await signIn(page, "labeluser");
  await page.goto("/books/new");
  await page.locator("#title").waitFor(); // wait for the form to render

  const fields = await page.locator("main input, main select, main textarea").all();
  expect(fields.length).toBeGreaterThan(0);

  for (const field of fields) {
    const id = await field.getAttribute("id");
    const labelled = await field.getAttribute("aria-labelledby");
    expect(id || labelled, "a field has no id or aria-labelledby").toBeTruthy();
    if (id && !labelled) {
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
  }
});

test("cancel on the add form returns to the collection", async ({ page }) => {
  await signIn(page, "canceluser");
  await page.goto("/books/new");
  await page.getByRole("button", { name: "CANCEL" }).click();
  await expect(page).toHaveURL(/\/books$/);
});

test("logging out hides the book pages again", async ({ page }) => {
  await signIn(page, "logoutuser");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/books");
  await expect(page.getByText("Log in to see your books")).toBeVisible();
});
