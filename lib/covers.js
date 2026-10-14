"use client";

import { getSupabaseBrowserClient } from "./supabase/client";
import { coverPath } from "./bookSchema";
import { makeCover } from "./images";

// Cover pictures are still shrunk in the browser first, then uploaded to the
// "covers" storage bucket in Supabase. The database row keeps only the URL,
// which is why collections are no longer limited by browser storage.
export async function uploadCover(file, userId) {
  const shrunk = await makeCover(file); // resize + WebP, from week 4

  const blob = await (await fetch(shrunk.dataUrl)).blob();
  const extension = shrunk.type === "image/webp" ? "webp" : "jpg";
  const path = coverPath(userId, `cover.${extension}`);

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from("covers").upload(path, blob, {
    contentType: shrunk.type,
    cacheControl: "31536000", // a cover never changes, so cache it for a year
    upsert: false,
  });

  if (error) {
    throw new Error("The cover picture couldn't be uploaded. Please try again.");
  }

  const { data } = supabase.storage.from("covers").getPublicUrl(path);

  return {
    url: data.publicUrl,
    path,
    width: shrunk.width,
    height: shrunk.height,
    bytes: shrunk.bytes,
    originalBytes: shrunk.originalBytes,
  };
}

// Used when a cover is replaced or removed, so the bucket doesn't fill up
// with pictures nothing points at any more.
export async function deleteCover(path) {
  if (!path) return;
  const supabase = getSupabaseBrowserClient();
  await supabase.storage.from("covers").remove([path]);
}
