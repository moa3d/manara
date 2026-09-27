"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteBook } from "@/app/admin/actions";
import { normalizeAr, formatYear } from "@/lib/text";
import type { CatalogBook } from "@/lib/types";
import Cover from "./Cover";
import Highlight from "./Highlight";
import { EditIcon, TrashIcon } from "./Icons";

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button className="btn btn-danger" disabled={pending}>{pending ? "جارٍ الحذف…" : "حذف الكتاب"}</button>;
}

export default function BooksTable({ books }: { books: CatalogBook[] }) {
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<CatalogBook | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!toDelete) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setToDelete(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toDelete]);

  const n = normalizeAr(q);
  const rows = books.filter((b) => !n || normalizeAr(`${b.title} ${b.author.name} ${b.publisher.name}`).includes(n));

  return (
    <div className="panel">
      <div className="tools">
        <label className="sr" htmlFor="tq">بحث في الجدول</label>
        <input className="input" id="tq" type="search" placeholder="ابحث بالعنوان أو الكاتب أو الدار" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="tscroll">
        <table>
          <thead>
            <tr>
              <th>الغلاف</th><th>اسم الكتاب</th><th>الكاتب</th><th>دار النشر</th><th>التصنيف</th><th>سنة النشر</th>
              <th><span className="sr">إجراءات</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td><Cover book={b} size="xs" /></td>
                <td className="tt"><Link href={`/books/${b.id}`}><Highlight text={b.title} q={q} /></Link></td>
                <td><Highlight text={b.author.name} q={q} /></td>
                <td><Highlight text={b.publisher.name} q={q} /></td>
                <td>{b.category.name}</td>
                <td className="tnum">{formatYear(b.publish_year)}</td>
                <td>
                  <div className="row">
                    <Link className="iconbtn" href={`/admin/books/${b.id}/edit`} aria-label={`تعديل ${b.title}`} title="تعديل"><EditIcon /></Link>
                    <button className="iconbtn del" onClick={() => setToDelete(b)} aria-label={`حذف ${b.title}`} title="حذف"><TrashIcon /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--ink-3)" }}>
                  {books.length ? "لا يوجد كتاب بهذا الاسم." : "لا توجد كتب بعد. اضغط «إضافة كتاب» لإضافة أول كتاب."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {toDelete && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setToDelete(null)}>
          <div className="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dt" aria-describedby="dd">
            <h2 id="dt">حذف «{toDelete.title}»؟</h2>
            <p id="dd">سيختفي الكتاب وصورة غلافه من الفهرس نهائيًا، ولا يمكن التراجع عن الحذف.</p>
            <form action={deleteBook} className="row">
              <input type="hidden" name="id" value={toDelete.id} />
              <button type="button" ref={cancelRef} className="btn btn-ghost" onClick={() => setToDelete(null)}>إلغاء</button>
              <DeleteButton />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
