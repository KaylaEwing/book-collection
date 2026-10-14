# Book Collection

A personal book collection website. Each user can add, view, search, edit, and delete their own books.

Built with Next.js (App Router), Supabase Auth, and PostgreSQL. Accounts, books, and cover
pictures are all stored in the database; nothing is kept in the browser any more.

## Pages

| Page | Path | What it does |
|---|---|---|
| Home | `/` | Landing page from the Figma home page design, with the "Take me to my books" button |
| Register | `/register` | Create an account |
| Log in | `/login` | The Figma log in design: welcome heading, email and password, register button |
| My Books | `/books` | List of your books with search, status filter, and sorting |
| Book detail | `/books/[id]` | All info for one book, with edit and delete |
| Add a book | `/books/new` | Form to create a book |
| Edit book | `/books/[id]/edit` | Form to update a book |
| About | `/about` | What the project is |

## Setting up the database

The site needs a Supabase project before it will do anything. This is a one-time setup.

1. **Create the project.** Sign in at supabase.com, click **New project**, and pick any
   name and a database password. Wait for it to finish starting up.

2. **Create the tables.** In the Supabase dashboard open **SQL Editor -> New query**,
   paste in the whole of `supabase/schema.sql`, and click **Run**. This creates the
   `books` and `profiles` tables, the storage bucket for cover pictures, the triggers,
   and every Row Level Security policy.

3. **Copy the two keys.** Go to **Project Settings -> API** and copy the *Project URL*
   and the *anon public* key.

4. **Add them locally.** Copy `.env.example` to `.env.local` and paste both values in:

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` is listed in `.gitignore` and must never be committed.

5. **Check it worked.**

   ```bash
   npm run check:db
   ```

   This connects and reports on the tables, the storage bucket, and whether Row Level
   Security is switched on.

6. **Add the same two variables to Vercel.** In the Vercel project, go to
   **Settings -> Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then redeploy. Without this step the deployed
   site shows a "Database not connected" notice instead of working.

## Run it on your computer

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## How the data is stored

| What | Where |
|---|---|
| Accounts and passwords | Supabase Auth (`auth.users`), hashed by Supabase; this code never sees a password |
| Usernames | `public.profiles`, created automatically by a trigger when someone signs up |
| Books | `public.books`, one row per book, tied to its owner by `user_id` |
| Cover pictures | The `covers` storage bucket, each user inside a folder named after their own id |

Every table has Row Level Security switched on, so the database itself refuses to return
one person's books to anyone else, even if the application code had a bug.

## Tests

The project uses Playwright for automated browser tests.

```bash
npm run test:unit        # validation rules; needs no database or browser
npx playwright install   # one time only, downloads the test browser
npm test                 # the full browser suite; needs a configured database
npm run test:responsive  # just the responsive design tests
npm run test:ui          # opens the test runner in a window
npm run check:db         # checks the live Supabase project is set up correctly
```

The browser tests sign up real accounts, so they skip themselves with a message if
`.env.local` has not been filled in yet.

`tests/sql/` holds the checks used to prove the database rules work: `00-supabase-stubs.sql`
recreates the parts of Supabase that `schema.sql` relies on, and `01-rls-test.sql` then
confirms that one account cannot read, change, or delete another account's books. They are
written for a throwaway local Postgres database. **Do not run them against the real
project** — the test script clears the tables before it starts.

There are 38 tests in four files:

- `tests/responsive.spec.js` — each page at 320, 390, 768, 1024, and 1440 pixels wide
- `tests/features.spec.js` — registering, logging in, create, read, update, delete, undo, filters, export
- `tests/pages.spec.js` — every page loads, navigation links, page titles, form labels
- `tests/media.spec.js` — cover pictures are shrunk, lazy loaded, and have alt text

## The home page photo

`public/library.jpg` holds the photo shown on the home page. Replace it with the
image exported from the Figma home page frame, keeping the same file name.

## Cover pictures

Covers are shrunk in the browser before they are saved. `lib/images.js` draws the
picture onto a canvas at no more than 400 x 600 pixels and saves it as WebP at 80%
quality, which takes a typical phone photo from several megabytes down to well under
100 KB. Browser storage only holds about 5 MB, so this keeps a collection from
filling it up.

## Branches

Work for each week is done on its own branch (for example `week-3`) and merged into `main` when it's finished and tested.

## Project structure

```
app/                 pages (one folder per route)
components/          Navbar, forms, providers, dialog
lib/books.js         reading statuses, sort options, sample books
tests/               automated browser tests
```
