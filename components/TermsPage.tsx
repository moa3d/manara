import { createClient } from "@/lib/supabase/server";
import { TERM_META, type Category, type TermKind } from "@/lib/types";
import TermsManager from "./TermsManager";

/** صفحة مشتركة لإدارة الكتّاب ودور النشر والتصنيفات */
export default async function TermsPage({ kind }: { kind: TermKind }) {
  const meta = TERM_META[kind];
  const supabase = await createClient();
  const cols = kind === "categories" ? "id,name,color" : "id,name";
  const [{ data: terms, error }, { data: links }] = await Promise.all([
    supabase.from(kind).select(cols),
    supabase.from("books").select(meta.fk as string),
  ]);

  const counts = new Map<number, number>();
  for (const row of (links ?? []) as unknown as Record<string, number>[]) {
    const id = row[meta.fk as string];
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const items = ((terms ?? []) as unknown as (Category | { id: number; name: string })[])
    .map((t) => ({ ...t, books: counts.get(t.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return (
    <>
      <div className="phead">
        <h1>{meta.title}</h1>
        <p className="sub">يرتبط كل كتاب بـ{meta.one} واحد. لا يمكن حذف {meta.one} ما دامت له كتب في الفهرس.</p>
      </div>
      {error ? <p className="form-error" role="alert">تعذّر التحميل: {error.message}</p> : <TermsManager kind={kind} items={items} />}
    </>
  );
}
