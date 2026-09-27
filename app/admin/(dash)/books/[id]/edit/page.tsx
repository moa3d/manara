import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookForm from "@/components/BookForm";
import { createClient } from "@/lib/supabase/server";
import { loadTerms } from "@/lib/terms";
import { BOOK_SELECT, type Book } from "@/lib/types";

export const metadata: Metadata = { title: "تعديل كتاب" };

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data }, terms] = await Promise.all([
    supabase.from("books").select(BOOK_SELECT).eq("id", Number(id)).maybeSingle(),
    loadTerms(supabase),
  ]);
  if (!data) notFound();
  return <BookForm key={id} book={data as unknown as Book} {...terms} />;
}
