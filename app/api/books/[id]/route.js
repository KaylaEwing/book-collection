import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { rowToBook, validateBook } from "@/lib/bookSchema";

// GET    /api/books/:id -> one book
// PATCH  /api/books/:id -> change some of its fields
// DELETE /api/books/:id -> remove it
//
// None of these routes filter by user_id by hand. Row Level Security does it,
// so a request for someone else's book simply finds nothing.

export async function GET(request, { params }) {
  const { id } = await params;
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

  const { data, error } = await supabase.from("books").select("*").eq("id", id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: "That book couldn't be loaded." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  return NextResponse.json({ book: rowToBook(data) });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
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

  // partial: only the fields that were sent are checked and updated
  const { valid, errors, values } = validateBook(body, { partial: true });
  if (!valid) {
    return NextResponse.json({ error: "Check the highlighted fields.", errors }, { status: 400 });
  }
  if (Object.keys(values).length === 0) {
    return NextResponse.json({ error: "There was nothing to change." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("books")
    .update(values)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Your changes couldn't be saved." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  return NextResponse.json({ book: rowToBook(data) });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
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
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "The book couldn't be deleted." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  // The deleted book is returned so the Undo button can put it back.
  return NextResponse.json({ book: rowToBook(data) });
}
