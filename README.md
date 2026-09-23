# Book Collection

A personal book collection website. Each user can add, view, search, edit, and delete their own books.

Built with Next.js (App Router). Supabase and PostgreSQL will be added for accounts and data starting Oct 13.

## Pages

| Page | Path | What it does |
|---|---|---|
| Home | `/` | Welcome page with log in form and register button (from Figma) |
| Register | `/register` | Create an account |
| Log in | `/login` | Log in to an existing account |
| My Books | `/books` | List of your books with search, status filter, and sorting |
| Book detail | `/books/[id]` | All info for one book, with edit and delete |
| Add a book | `/books/new` | Form to create a book |
| Edit book | `/books/[id]/edit` | Form to update a book |
| About | `/about` | What the project is |

## Run it on your computer

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Current data storage (temporary)

Until the backend is built, accounts and books are saved in the browser with `localStorage`.
The functions in `components/AuthProvider.js` and `components/BooksProvider.js` are the only
places that need to change when switching to Supabase.

## Tests

The project uses Playwright for automated browser tests.

```bash
npx playwright install   # one time only, downloads the test browser
npm test                 # runs every test
npm run test:responsive  # runs only the responsive design tests
npm run test:ui          # opens the test runner in a window
```

`tests/responsive.spec.js` checks each page at 320, 390, 768, 1024, and 1440 pixels wide.
`tests/features.spec.js` checks registering, logging in, and the create, read, update, and delete actions.

## Branches

Work for each week is done on its own branch (for example `week-3`) and merged into `main` when it's finished and tested.

## Project structure

```
app/                 pages (one folder per route)
components/          Navbar, forms, providers, dialog
lib/books.js         reading statuses, sort options, sample books
tests/               automated browser tests
```
