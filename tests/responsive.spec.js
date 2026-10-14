// Responsive design tests.
// These check that every page fits five common screen sizes without
// sideways scrolling, that the navigation collapses into a menu on small
// screens, that the book cards change column count, and that buttons stay
// big enough to tap.
import { test, expect, signUp, addBook, requireDatabase } from "./helpers.js";

// The layout checks visit signed-in pages, so a configured database is required.
requireDatabase();

const SIZES = [
  { name: "small phone", width: 320, height: 720 },
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "small laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

const PAGES = ["/", "/register", "/login", "/about", "/books", "/books/new"];

// Creates an account so the book pages can be tested
test.describe("layout fits every screen size", () => {
  for (const size of SIZES) {
    test(`no sideways scrolling on a ${size.name} (${size.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height });
      await signUp(page, `user${size.width}`);

      for (const path of PAGES) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth, `${path} overflows at ${size.width}px`).toBeLessThanOrEqual(size.width);
      }
    });
  }
});

test("navigation collapses into a menu on phones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");

  const aboutLink = page.getByRole("link", { name: "About" });
  // The button's label changes to "Close" when the menu is open,
  // so find it by what it controls instead of by its text.
  const menuButton = page.locator('button[aria-controls="main-menu"]');

  await expect(menuButton).toBeVisible();
  await expect(aboutLink).toBeHidden();

  await menuButton.click();
  await expect(aboutLink).toBeVisible();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
});

test("navigation links show without a menu button on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/about");

  await expect(page.getByRole("link", { name: "About" })).toBeVisible();
  await expect(page.locator('button[aria-controls="main-menu"]')).toBeHidden();
});

test("book cards go from one column on a phone to several on desktop", async ({ page }) => {
  await signUp(page, "griduser");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/books");
  const grid = page.getByTestId("book-grid");
  await grid.waitFor();

  const columnCount = () =>
    grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);

  expect(await columnCount()).toBe(1);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect.poll(columnCount).toBeGreaterThan(1);
});

test("buttons stay big enough to tap on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signUp(page, "tapuser");
  await page.goto("/books");

  // Only the site's own buttons. While `npm run dev` is running, Next.js adds
  // a small dev-tools button in the corner that isn't part of the site.
  const buttons = await page.locator("header button, main button").all();
  expect(buttons.length).toBeGreaterThan(0);

  for (const button of buttons) {
    if (!(await button.isVisible())) continue;
    const box = await button.boundingBox();
    const name = (await button.textContent())?.trim();
    expect(box.height, `"${name}" is too short to tap`).toBeGreaterThanOrEqual(40);
  }
});

test("images and text never force a horizontal scrollbar on a long book", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await signUp(page, "longuser");
  await page.goto("/books/new");
  await page.fill("#title", "Supercalifragilisticexpialidocious".repeat(2));
  await page.fill("#author", "A".repeat(60));
  await page.getByRole("button", { name: "SAVE BOOK" }).click();
  // Wait for the detail page, not the form page it just left
  await page.waitForURL(/\/books\/(?!new)[^/]+$/);

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(320);
});
