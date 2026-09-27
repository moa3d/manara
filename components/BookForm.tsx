"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createTerm, saveBook, type BookFormState } from "@/app/admin/actions";
import { COVER_TYPES, MAX_COVER_BYTES, validateBook, type BookInput, type FieldErrors } from "@/lib/validate";
import { LANGUAGES, type Book, type Category, type Term, type TermKind } from "@/lib/types";
import Cover from "./Cover";
import { BackIcon, CheckIcon, UploadIcon } from "./Icons";

type Props = { book?: Book | null; authors: Term[]; publishers: Term[]; categories: Category[] };

const toInput = (b?: Book | null): BookInput => ({
  title: b?.title ?? "",
  author_id: b ? String(b.author_id) : "",
  publisher_id: b ? String(b.publisher_id) : "",
  category_id: b ? String(b.category_id) : "",
  publish_year: b ? String(b.publish_year) : "",
  language: b?.language ?? "العربية",
  pages: b?.pages ? String(b.pages) : "",
  isbn: b?.isbn ?? "",
  description: b?.description ?? "",
  shelf_code: b?.shelf_code ?? "",
});

type SelectKey = "author_id" | "publisher_id" | "category_id";
const KIND: Record<SelectKey, TermKind> = { author_id: "authors", publisher_id: "publishers", category_id: "categories" };
const ONE: Record<SelectKey, string> = { author_id: "كاتب", publisher_id: "دار نشر", category_id: "تصنيف" };

export default function BookForm({ book, authors, publishers, categories }: Props) {
  const editing = !!book;
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(saveBook, { errors: {} });
  const [v, setV] = useState<BookInput>(toInput(book));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lists, setLists] = useState({ author_id: authors, publisher_id: publishers, category_id: categories as Term[] });
  const [newName, setNewName] = useState<Partial<Record<SelectKey, string>>>({});
  const [newErr, setNewErr] = useState<Partial<Record<SelectKey, string>>>({});
  const [adding, startAdding] = useTransition();
  const [preview, setPreview] = useState<string | null>(book?.cover_url ?? null);
  const [removeCover, setRemoveCover] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // أخطاء الخادم (مثل تكرار ISBN)
  useEffect(() => {
    const errs = { ...state.errors };
    // React يفرّغ حقل الملف بعد إرسال النموذج؛ إن رفض الخادم الحفظ نطلب إعادة اختيار الصورة
    if (Object.keys(errs).length && preview?.startsWith("blob:") && !fileRef.current?.files?.length) {
      setPreview(book?.cover_url ?? null);
      errs.cover ??= "أعد اختيار صورة الغلاف قبل الحفظ.";
    }
    setErrors(errs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    first?.focus();
  }, [errors]);

  const set = (k: keyof BookInput, val: string) => {
    setV((c) => ({ ...c, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const pickFile = (file?: File | null) => {
    setErrors((e) => ({ ...e, cover: undefined }));
    if (!file) return;
    if (!COVER_TYPES.includes(file.type)) return setErrors((e) => ({ ...e, cover: "الملف ليس صورة JPG أو PNG أو WebP." }));
    if (file.size > MAX_COVER_BYTES) return setErrors((e) => ({ ...e, cover: "حجم الصورة أكبر من 2 ميغابايت. اختر صورة أصغر." }));
    if (fileRef.current && fileRef.current.files?.[0] !== file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileRef.current.files = dt.files;
    }
    setRemoveCover(false);
    setPreview(URL.createObjectURL(file));
  };

  const clearCover = () => {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setRemoveCover(true);
  };

  const addTerm = (k: SelectKey) => {
    const name = (newName[k] ?? "").trim();
    if (!name) return setNewErr((e) => ({ ...e, [k]: `اكتب اسم ${ONE[k]}.` }));
    startAdding(async () => {
      const r = await createTerm(KIND[k], name);
      if (!r.ok) return setNewErr((e) => ({ ...e, [k]: r.error }));
      setLists((l) => ({ ...l, [k]: l[k].some((x) => x.id === r.term.id) ? l[k] : [...l[k], r.term] }));
      set(k, String(r.term.id));
      setNewName((n) => { const c = { ...n }; delete c[k]; return c; });
      setNewErr((e) => ({ ...e, [k]: undefined }));
    });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const errs = validateBook(v);
    if (errors.cover) errs.cover = errors.cover;
    if (Object.keys(errs).length) {
      e.preventDefault();
      setErrors(errs);
    }
  };

  const invalid = (k: keyof FieldErrors) =>
    errors[k] ? { "aria-invalid": true as const, "aria-describedby": `e-${k}` } : {};
  const Err = ({ k, hint }: { k: keyof FieldErrors; hint?: string }) =>
    errors[k] ? <span className="err" id={`e-${k}`}>{errors[k]}</span> : hint ? <span className="hint">{hint}</span> : null;

  const select = (k: SelectKey, label: string) => {
    const creating = newName[k] !== undefined;
    return (
      <div className="field">
        <label htmlFor={`f-${k}`}>{label}</label>
        <select
          className="input" id={`f-${k}`} name={k} value={creating ? "__new" : v[k]} {...invalid(k)}
          onChange={(e) => {
            if (e.target.value === "__new") { setNewName((n) => ({ ...n, [k]: "" })); set(k, ""); }
            else { setNewName((n) => { const c = { ...n }; delete c[k]; return c; }); set(k, e.target.value); }
          }}
        >
          <option value="">اختر {ONE[k]}</option>
          {[...lists[k]].sort((a, b) => a.name.localeCompare(b.name, "ar")).map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
          <option value="__new">＋ {ONE[k]} جديد…</option>
        </select>
        {creating && (
          <div className="newinline">
            <label className="sr" htmlFor={`n-${k}`}>اسم {ONE[k]} الجديد</label>
            <input
              className="input" id={`n-${k}`} autoFocus placeholder={`اسم ${ONE[k]}`} value={newName[k]}
              onChange={(e) => setNewName((n) => ({ ...n, [k]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTerm(k); } }}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => addTerm(k)} disabled={adding}>إضافة</button>
          </div>
        )}
        {newErr[k] && <span className="err">{newErr[k]}</span>}
        <Err k={k} />
      </div>
    );
  };

  const nameOf = (k: SelectKey) => lists[k].find((x) => String(x.id) === v[k]);
  const previewBook = {
    title: v.title,
    cover_url: preview,
    author: nameOf("author_id") ?? null,
    category: (nameOf("category_id") as Category | undefined) ?? null,
  };

  return (
    <>
      <Link href="/admin" className="back" style={{ marginTop: 0 }}><BackIcon /> العودة إلى قائمة الكتب</Link>
      <div className="phead"><h1>{editing ? "تعديل كتاب" : "إضافة كتاب جديد"}</h1></div>

      <form ref={formRef} className={`form ${pending ? "pending" : ""}`} action={formAction} onSubmit={onSubmit} noValidate>
        {book && <input type="hidden" name="id" value={book.id} />}
        <input type="hidden" name="remove_cover" value={removeCover ? "1" : "0"} />
        <div>
          {errors.form && <p className="form-error" role="alert" style={{ marginTop: 0 }}>{errors.form}</p>}
          <fieldset className="sect">
            <legend className="sr">البيانات الأساسية</legend>
            <h2>البيانات الأساسية</h2>
            <div className="fgrid">
              <div className="field full">
                <label htmlFor="f-title">اسم الكتاب</label>
                <input className="input" id="f-title" name="title" autoComplete="off" value={v.title} onChange={(e) => set("title", e.target.value)} {...invalid("title")} />
                <Err k="title" />
              </div>
              {select("author_id", "الكاتب")}
              {select("publisher_id", "دار النشر")}
              {select("category_id", "التصنيف")}
              <div className="field">
                <label htmlFor="f-year">سنة النشر</label>
                <input className="input tnum" id="f-year" name="publish_year" inputMode="numeric" placeholder="مثال: 1988" value={v.publish_year} onChange={(e) => set("publish_year", e.target.value)} {...invalid("publish_year")} />
                <Err k="publish_year" hint="للكتب القديمة قبل الميلاد اكتب رقمًا سالبًا" />
              </div>
            </div>
          </fieldset>

          <fieldset className="sect">
            <legend className="sr">تفاصيل إضافية</legend>
            <h2>تفاصيل إضافية</h2>
            <div className="fgrid">
              <div className="field">
                <label htmlFor="f-language">اللغة</label>
                <select className="input" id="f-language" name="language" value={v.language} onChange={(e) => set("language", e.target.value)}>
                  {[...new Set([...LANGUAGES, v.language])].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="f-pages">عدد الصفحات</label>
                <input className="input tnum" id="f-pages" name="pages" inputMode="numeric" value={v.pages} onChange={(e) => set("pages", e.target.value)} {...invalid("pages")} />
                <Err k="pages" />
              </div>
              <div className="field">
                <label htmlFor="f-isbn">رقم ISBN (اختياري)</label>
                <input className="input tnum" id="f-isbn" name="isbn" dir="ltr" inputMode="numeric" placeholder="978…" value={v.isbn} onChange={(e) => set("isbn", e.target.value)} {...invalid("isbn")} />
                <Err k="isbn" hint="10 أو 13 رقمًا، بشرطات أو بدونها" />
              </div>
              <div className="field">
                <label htmlFor="f-shelf">رمز الرف (اختياري)</label>
                <input className="input" id="f-shelf" name="shelf_code" dir="ltr" placeholder="A-12" value={v.shelf_code} onChange={(e) => set("shelf_code", e.target.value)} />
                <span className="hint">يساعد الزائر على إيجاد الكتاب في المكتبة</span>
              </div>
              <div className="field full">
                <label htmlFor="f-description">وصف مختصر</label>
                <textarea className="input" id="f-description" name="description" maxLength={1000} value={v.description} onChange={(e) => set("description", e.target.value)} {...invalid("description")} />
                {errors.description ? <Err k="description" /> : <span className="hint tnum">{v.description.length} / 1000 حرف</span>}
              </div>
            </div>
          </fieldset>

          <div className="factions">
            <button className="btn btn-primary" disabled={pending}>
              <CheckIcon /> {pending ? "جارٍ الحفظ…" : editing ? "حفظ التعديلات" : "إضافة الكتاب"}
            </button>
            <Link href="/admin" className="btn btn-ghost">إلغاء</Link>
          </div>
        </div>

        <aside className="preview">
          <span className="flabel">صورة الغلاف</span>
          <Cover book={previewBook} />
          <label
            className={`drop ${drag ? "over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]); }}
          >
            <UploadIcon />
            <span>{preview ? "استبدال الصورة" : "اسحب صورة الغلاف هنا أو اضغط للاختيار"}</span>
            <span className="hint">JPG أو PNG أو WebP، حتى 2 ميغابايت</span>
            <input ref={fileRef} type="file" name="cover" accept={COVER_TYPES.join(",")} className="sr" onChange={(e) => pickFile(e.target.files?.[0])} {...invalid("cover")} />
          </label>
          {preview
            ? <button type="button" className="link" onClick={clearCover}>إزالة الصورة واستخدام الغلاف المولّد</button>
            : <span className="hint">بدون صورة، يُولَّد غلاف بلون التصنيف.</span>}
          <Err k="cover" />
        </aside>
      </form>
    </>
  );
}
