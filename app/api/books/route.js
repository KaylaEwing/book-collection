import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { rowToBook, validateBook } from "@/lib/bookSchema";

// GET /api/books  -> the signed-in user's collection
// POST /api/books -> add a book
//
// Every request is checked for a signed-in user first. Row Level Security on
// the database is the second line of defence: even if this code had a bug,
// Postgres would not return another user's rows.

export async function GET() {
  const { supabase, user, configured } = await getCurrentUser();
  if (!configured) {
    return NextResponse.json(
      { error: "This site isn't connected to its database yet." },
      { status: 503 }
    );
  }
  if (!user) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Your books couldn't be loaded." }, { status: 500 });
  }

  return NextResponse.json({ books: data.map(rowToBook) });
}

export async function POST(request) {
  const { supabase, user, configured } = await getCurrentUser();
  if (!configured) {
    return NextResponse.json(
      { error: "This site isn't connected to its database yet." },
      { status: 503 }
    );
  }
  if (!user) {
    return NextResponse.json({ error: "You need to be logged in." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request wasn't valid." }, { status: 400 });
  }

  const { valid, errors, values } = validateBook(body);
  if (!valid) {
    return NextResponse.json({ error: "Check the highlighted fields.", errors }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("books")
    .insert({ ...values, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "The book couldn't be saved." }, { status: 500 });
  }

  return NextResponse.json({ book: rowToBook(data) }, { status: 201 });
}
