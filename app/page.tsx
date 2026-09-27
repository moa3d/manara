import Catalog from "@/components/Catalog";
import { parseCatalogParams } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { CATALOG_SELECT, type Category, type CatalogBook, type Term } from "@/lib/types";

// الفهرس يُقرأ من قاعدة البيانات في كل طلب ليظهر أي كتاب جديد فورًا
export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();
  const [books, authors, publishers, categories] = await Promise.all([
    supabase.from("books").select(CATALOG_SELECT).order("created_at", { ascending: false }),
    supabase.from("authors").select("id,name"),
    supabase.from("publishers").select("id,name"),
    supabase.from("categories").select("id,name,color").order("id"),
  ]);

  const error = books.error || authors.error || publishers.error || categories.error;
  if (error) {
    return (
      <div className="notice" role="alert">
        <h1>تعذّر تحميل الفهرس</h1>
        <p>لم نتمكن من الاتصال بقاعدة البيانات. تحقق من إعدادات Supabase في ملف ‎.env.local‎ ثم أعد تحميل الصفحة.</p>
        <p className="hint">{error.message}</p>
      </div>
    );
  }

  const sp = await searchParams;
  return (
    <Catalog
      key={JSON.stringify(sp)}
      books={(books.data ?? []) as unknown as CatalogBook[]}
      authors={(authors.data ?? []) as Term[]}
      publishers={(publishers.data ?? []) as Term[]}
      categories={(categories.data ?? []) as Category[]}
      initial={parseCatalogParams(sp)}
    />
  );
}
