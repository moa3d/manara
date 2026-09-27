import type { Metadata } from "next";
import BookForm from "@/components/BookForm";
import { createClient } from "@/lib/supabase/server";
import { loadTerms } from "@/lib/terms";

export const metadata: Metadata = { title: "إضافة كتاب" };

export default async function NewBookPage() {
  const terms = await loadTerms(await createClient());
  return <BookForm {...terms} />;
}
