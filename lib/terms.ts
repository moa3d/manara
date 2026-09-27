import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Term } from "./types";

export async function loadTerms(supabase: SupabaseClient) {
  const [a, p, c] = await Promise.all([
    supabase.from("authors").select("id,name"),
    supabase.from("publishers").select("id,name"),
    supabase.from("categories").select("id,name,color").order("id"),
  ]);
  return {
    authors: (a.data ?? []) as Term[],
    publishers: (p.data ?? []) as Term[],
    categories: (c.data ?? []) as Category[],
  };
}
