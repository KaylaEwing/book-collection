// Media tests: cover pictures are shrunk before saving, are lazy loaded,
// have set dimensions so the layout doesn't jump, and have alt text.
import { test, expect, signUp, addBook, requireDatabase } from "./helpers.js";

// Cover uploads go to Supabase Storage, so a configured database is required.
requireDatabase();
import path from "path";
import fs from "fs";

// Paths are based on the project folder, which is where Playwright runs from
const FIXTURE = path.join(process.cwd(), "tests", "fixtures", "large-cover.png");

test("a large picture is shrunk before it is saved", async ({ page }) => {
  await signUp(page, "coveruser");
  await page.goto("/books/new");

  await page.setInputFiles("#cover", FIXTURE);
  const preview = page.getByTestId("cover-preview");
  await expect(preview).toBeVisible();

  // The stored picture fits inside 400 x 600
  const size = await preview.evaluate((img) => ({
    width: Number(img.getAttribute("width")),
    height: Number(img.getAttribute("height")),
    bytes: Math.round((img.src.length - img.src.indexOf(",") - 1) * 0.75),
    format: img.src.slice(5, img.src.indexOf(";")),
  }));

  expect(size.width).toBeLessThanOrEqual(400);
  expect(size.height).toBeLessThanOrEqual(600);
  expect(size.format).toMatch(/image\/(webp|jpeg)/);

  // and it is far smaller than the file that was chosen
  const originalBytes = fs.statSync(FIXTURE).size;
  expect(size.bytes).toBeLessThan(originalBytes / 2);
  expect(size.bytes).toBeLessThan(200 * 1024);

  await expect(page.getByText(/Shrunk from .* to /)).toBeVisible();
});

test("a saved cover shows on the card and the detail page", async ({ page }) => {
  await signUp(page, "coveruser2");
  await page.goto("/books/new");
  await page.fill("#title", "Cover Test");
  await page.fill("#author", "A Photographer");
  await page.setInputFiles("#cover", FIXTURE);
  await expect(page.getByTestId("cover-preview")).toBeVisible();
  await page.getByRole("button", { name: "SAVE BOOK" }).click();
  await page.waitForURL(/\/books\/(?!new)[^/]+$/);

  const detailCover = page.getByAltText("Cover of Cover Test");
  await expect(detailCover).toBeVisible();

  await page.goto("/books");
  await expect(page.getByAltText("Cover of Cover Test")).toBeVisible();
});

test("covers are lazy loaded and have set dimensions", async ({ page }) => {
  await signUp(page, "lazyuser");
  await page.goto("/books/new");
  await page.fill("#title", "Lazy Test");
  await page.fill("#author", "An Author");
  await page.setInputFiles("#cover", FIXTURE);
  await expect(page.getByTestId("cover-preview")).toBeVisible();
  await page.getByRole("button", { name: "SAVE BOOK" }).click();
  await page.waitForURL(/\/books\/(?!new)[^/]+$/);

  await page.goto("/books");
  const cover = page.getByAltText("Cover of Lazy Test");
  await expect(cover).toHaveAttribute("loading", "lazy");
  await expect(cover).toHaveAttribute("decoding", "async");
  await expect(cover).toHaveAttribute("width", /\d+/);
  await expect(cover).toHaveAttribute("height", /\d+/);
});

test("books without a cover show a placeholder instead of a broken image", async ({ page }) => {
  await signUp(page, "nocoveruser");
  await page.goto("/books");

  // Sample books have no cover, so no image element should be there
  const broken = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main img")).filter((img) => !img.currentSrc).length
  );
  expect(broken).toBe(0);
});

test("a file that isn't an image is rejected", async ({ page }) => {
  await signUp(page, "badfileuser");
  await page.goto("/books/new");

  await page.setInputFiles("#cover", {
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("this is not a picture"),
  });

  await expect(page.getByText("Choose an image file, such as a JPG or PNG.")).toBeVisible();
});

test("a cover can be removed again", async ({ page }) => {
  await signUp(page, "removecoveruser");
  await page.goto("/books/new");
  await page.setInputFiles("#cover", FIXTURE);
  await expect(page.getByTestId("cover-preview")).toBeVisible();
  await page.getByRole("button", { name: "REMOVE" }).click();
  await expect(page.getByTestId("cover-preview")).toHaveCount(0);
});
