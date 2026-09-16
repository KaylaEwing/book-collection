export const metadata = { title: "About | Book Collection" };

export default function AboutPage() {
  return (
    <div className="container narrow">
      <h1 className="page-title">About this project</h1>
      <div className="panel" style={{ marginTop: 28, lineHeight: 1.65, fontSize: 18 }}>
        <p>
          Book Collection is a personal reading list. Each person has their own
          account and their own list of books, and nobody else can see it.
        </p>
        <p style={{ marginTop: 16 }}>
          You can add a book with its title and author, mark it as want to read,
          reading, or read, give it a rating from 1 to 5, and write notes about it.
          You can search and filter your list, open any book to see its details,
          edit it, or delete it.
        </p>
        <p style={{ marginTop: 16 }}>
          The site is built with Next.js. Accounts and book data will be stored
          with Supabase and PostgreSQL, and the site is hosted on Vercel.
        </p>
      </div>
    </div>
  );
}
