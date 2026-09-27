import type { Metadata } from "next";
import Link from "next/link";
import BooksTable from "@/components/BooksTable";
import { PlusIcon } from "@/components/Icons";
import { createClient } from "@/lib/supabase/server";
import { CATALOG_SELECT, type CatalogBook } from "@/lib/types";

export const metadata: Metadata = { title: "إدارة الكتب" };

export default async function AdminBooksPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("books").select(CATALOG_SELECT).order("created_at", { ascending: false });
  return (
    <>
      <div className="phead">
        <h1>إدارة الكتب</h1>
        <div className="acts">
          <Link href="/admin/books/new" className="btn btn-primary"><PlusIcon /> إضافة كتاب</Link>
        </div>
      </div>
      {error ? <p className="form-error" role="alert">تعذّر تحميل الكتب: {error.message}</p>
        : <BooksTable books={(data ?? []) as unknown as CatalogBook[]} />}
    </>
  );
}
