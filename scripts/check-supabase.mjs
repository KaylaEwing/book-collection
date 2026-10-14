// Checks that Supabase is set up correctly: run `npm run check:db`.
// It reads .env.local, connects, and reports on the tables, the storage
// bucket, and whether Row Level Security is blocking anonymous reads.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // no .env.local; fall back to whatever is already in the environment
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  console.error("  Copy .env.example to .env.local and fill in your project's values.");
  process.exit(1);
}

const supabase = createClient(url, key);
let failures = 0;

const check = (ok, pass, fail) => {
  console.log(ok ? `✓ ${pass}` : `✗ ${fail}`);
  if (!ok) failures++;
};

// 1. The tables exist and are reachable
for (const table of ["books", "profiles"]) {
  const { error } = await supabase.from(table).select("id").limit(1);
  const missing = error && /does not exist|schema cache/i.test(error.message);
  check(!missing, `the ${table} table exists`, `the ${table} table is missing — run supabase/schema.sql`);
}

// 2. Row Level Security hides rows from someone who isn't logged in
const { data: anonRows, error: anonError } = await supabase.from("books").select("id");
check(
  (anonRows?.length ?? 0) === 0 || !!anonError,
  "row level security hides books from signed-out visitors",
  "books are readable without logging in — check that RLS is enabled"
);

// 3. The covers bucket exists
const { error: bucketError } = await supabase.storage.from("covers").list("", { limit: 1 });
check(!bucketError, "the covers storage bucket exists", `the covers bucket is missing (${bucketError?.message ?? ""})`);

console.log(failures === 0 ? "\nSupabase looks ready." : `\n${failures} problem(s) to fix.`);
process.exit(failures === 0 ? 0 : 1);
