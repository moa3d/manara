"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, CatalogBook, Term } from "@/lib/types";
import { booksWord, normalizeAr } from "@/lib/text";
import { LAST_CATALOG_KEY } from "./BackLink";
import BookCard from "./BookCard";
import { FilterIcon, SearchIcon, XIcon } from "./Icons";

import { EMPTY_FILTERS as EMPTY, type CatalogState, type Facet, type Filters, type Scope, type Sort } from "@/lib/catalog";

function toQuery(s: CatalogState) {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.scope !== "all") p.set("in", s.scope);
  if (s.sort !== "added") p.set("sort", s.sort);
  if (s.f.author.length) p.set("author", s.f.author.join(","));
  if (s.f.publisher.length) p.set("publisher", s.f.publisher.join(","));
  if (s.f.category.length) p.set("category", s.f.category.join(","));
  if (s.f.language.length) p.set("lang", s.f.language.join(","));
  if (s.f.from) p.set("from", s.f.from);
  if (s.f.to) p.set("to", s.f.to);
  const str = p.toString();
  return str ? `?${str}` : "";
}

const PLACEHOLDER: Record<Scope, string> = {
  all: "ابحث باسم الكتاب أو الكاتب أو دار النشر",
  title: "مثال: الخيميائي",
  author: "مثال: باولو كويلو",
  publisher: "مثال: دار الآداب",
};

type Props = {
  books: CatalogBook[];
  authors: Term[];
  publishers: Term[];
  categories: Category[];
  initial: CatalogState;
};

export default function Catalog({ books, authors, publishers, categories, initial }: Props) {
  const [q, setQ] = useState(initial.q);
  const [scope, setScope] = useState<Scope>(initial.scope);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [f, setF] = useState<Filters>(initial.f);
  const [sheet, setSheet] = useState(false);
  const qRef = useRef<HTMLInputElement>(null);

  // حالة البحث في الرابط: يمكن مشاركتها، وزر الرجوع من صفحة الكتاب يعيدها كما كانت
  useEffect(() => {
    const t = setTimeout(() => {
      const url = window.location.pathname + toQuery({ q, scope, sort, f });
      window.history.replaceState(window.history.state, "", url);
      try { sessionStorage.setItem(LAST_CATALOG_KEY, url); } catch { /* غير متاح */ }
    }, 250);
    return () => clearTimeout(t);
  }, [q, scope, sort, f]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  // نصوص موحّدة مسبقًا لكل كتاب
  const indexed = useMemo(
    () => books.map((b) => ({ b, t: normalizeAr(b.title), a: normalizeAr(b.author.name), p: normalizeAr(b.publisher.name) })),
    [books],
  );

  const nq = normalizeAr(q);
  const digits = q.replace(/\D/g, "");

  const passes = (x: (typeof indexed)[number], skip?: Facet) => {
    const b = x.b;
    if (skip !== "author" && f.author.length && !f.author.includes(b.author_id)) return false;
    if (skip !== "publisher" && f.publisher.length && !f.publisher.includes(b.publisher_id)) return false;
    if (skip !== "category" && f.category.length && !f.category.includes(b.category_id)) return false;
    if (skip !== "language" && f.language.length && !f.language.includes(b.language)) return false;
    if (f.from !== "" && !isNaN(+f.from) && b.publish_year < +f.from) return false;
    if (f.to !== "" && !isNaN(+f.to) && b.publish_year > +f.to) return false;
    if (!nq) return true;
    if (scope === "title") return x.t.includes(nq);
    if (scope === "author") return x.a.includes(nq);
    if (scope === "publisher") return x.p.includes(nq);
    return x.t.includes(nq) || x.a.includes(nq) || x.p.includes(nq) || (digits.length >= 4 && !!b.isbn?.includes(digits));
  };

  const results = indexed.filter((x) => passes(x)).map((x) => x.b);
  results.sort((a, b) =>
    sort === "new" ? b.publish_year - a.publish_year
    : sort === "old" ? a.publish_year - b.publish_year
    : sort === "title" ? a.title.localeCompare(b.title, "ar")
    : b.created_at.localeCompare(a.created_at) || b.id - a.id,
  );

  const facetCount = (key: Facet, pred: (b: CatalogBook) => boolean) =>
    indexed.filter((x) => passes(x, key) && pred(x.b)).length;

  const activeCount =
    f.author.length + f.publisher.length + f.category.length + f.language.length + (f.from ? 1 : 0) + (f.to ? 1 : 0);

  const toggle = <K extends Facet>(k: K, v: Filters[K][number]) =>
    setF((cur) => {
      const arr = cur[k] as (typeof v)[];
      return { ...cur, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  const clearFilters = () => setF(EMPTY);
  const clearQuery = () => { setQ(""); qRef.current?.focus(); };

  // مطابقة مباشرة لكاتب أو دار نشر: زر يحوّل البحث إلى فلتر
  const direct: { kind: "author" | "publisher"; term: Term; n: number }[] = [];
  if (nq.length >= 2) {
    if (scope === "all" || scope === "author")
      authors.filter((a) => normalizeAr(a.name).includes(nq) && !f.author.includes(a.id)).slice(0, 3).forEach((a) => {
        const n = books.filter((b) => b.author_id === a.id).length;
        if (n) direct.push({ kind: "author", term: a, n });
      });
    if (scope === "all" || scope === "publisher")
      publishers.filter((p) => normalizeAr(p.name).includes(nq) && !f.publisher.includes(p.id)).slice(0, 3).forEach((p) => {
        const n = books.filter((b) => b.publisher_id === p.id).length;
        if (n) direct.push({ kind: "publisher", term: p, n });
      });
  }
  const pick = (kind: "author" | "publisher", id: number) => { setF((c) => ({ ...c, [kind]: [id] })); setQ(""); };

  const byName = <T extends Term>(arr: T[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  const languages = [...new Set(books.map((b) => b.language))];
  const nameOf = (arr: Term[], id: number) => arr.find((x) => x.id === id)?.name ?? "—";

  const tags: { label: string; value: string; remove: () => void }[] = [
    ...f.category.map((id) => ({ label: "التصنيف", value: nameOf(categories, id), remove: () => toggle("category", id) })),
    ...f.author.map((id) => ({ label: "الكاتب", value: nameOf(authors, id), remove: () => toggle("author", id) })),
    ...f.publisher.map((id) => ({ label: "دار النشر", value: nameOf(publishers, id), remove: () => toggle("publisher", id) })),
    ...f.language.map((l) => ({ label: "اللغة", value: l, remove: () => toggle("language", l) })),
    ...(f.from ? [{ label: "من سنة", value: f.from, remove: () => setF((c) => ({ ...c, from: "" })) }] : []),
    ...(f.to ? [{ label: "حتى سنة", value: f.to, remove: () => setF((c) => ({ ...c, to: "" })) }] : []),
  ];

  const facetList = (key: "author" | "publisher", items: Term[], field: "author_id" | "publisher_id") => (
    <div className="opts">
      {items.map((it) => {
        const n = facetCount(key, (b) => b[field] === it.id);
        const on = f[key].includes(it.id);
        return (
          <label key={it.id} className={`opt ${!n && !on ? "zero" : ""}`}>
            <input type="checkbox" checked={on} onChange={() => toggle(key, it.id)} />
            <span>{it.name}</span>
            <span className="n tnum">{n}</span>
          </label>
        );
      })}
    </div>
  );

  return (
    <>
      <section className="hero">
        <h1>أي كتاب تبحث عنه؟</h1>
        <p>
          فهرس {books.length} {booksWord(books.length)} في مكتبة دار الرموز العربية. ابحث بالاسم أو ضيّق النتائج بالتصنيف والكاتب
          وسنة النشر، ثم افتح الكتاب لتعرف بياناته كاملة.
        </p>
        <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
          <span className="ic"><SearchIcon /></span>
          <label className="sr" htmlFor="q">بحث في الفهرس</label>
          <input id="q" ref={qRef} type="search" autoComplete="off" placeholder={PLACEHOLDER[scope]} value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button type="button" className="clear" onClick={clearQuery} aria-label="مسح البحث"><XIcon /></button>}
          <label className="sr" htmlFor="scope">البحث في</label>
          <select id="scope" value={scope} onChange={(e) => { setScope(e.target.value as Scope); qRef.current?.focus(); }}>
            <option value="all">الكل</option>
            <option value="title">اسم الكتاب</option>
            <option value="author">اسم الكاتب</option>
            <option value="publisher">دار النشر</option>
          </select>
        </form>
        {direct.length > 0 && (
          <div className="matches">
            <span>تطابق مباشر:</span>
            {direct.map((d) => (
              <button key={d.kind + d.term.id} type="button" className="match" onClick={() => pick(d.kind, d.term.id)}>
                {d.kind === "author" ? "كل كتب " : "كل إصدارات "}<b>{d.term.name}</b> ({d.n})
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="cat">
        <aside className={`filters ${sheet ? "open" : ""}`} aria-label="الفلاتر">
          <div className="fhead">
            <h2>تضييق النتائج</h2>
            {activeCount > 0 && <button type="button" className="link" onClick={clearFilters}>مسح الكل</button>}
          </div>
          <div className="facet">
            <h3>التصنيف</h3>
            <div className="chips">
              {categories.map((c) => (
                <button key={c.id} type="button" className="chip" style={{ "--c": c.color } as React.CSSProperties} aria-pressed={f.category.includes(c.id)} onClick={() => toggle("category", c.id)}>
                  <span className="sw" />{c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="facet"><h3>الكاتب</h3>{facetList("author", byName(authors), "author_id")}</div>
          <div className="facet"><h3>دار النشر</h3>{facetList("publisher", byName(publishers), "publisher_id")}</div>
          <div className="facet">
            <h3 id="yl">سنة النشر</h3>
            <div className="years" role="group" aria-labelledby="yl">
              <div className="field">
                <label htmlFor="yf">من</label>
                <input className="input tnum" id="yf" inputMode="numeric" placeholder="1900" value={f.from} onChange={(e) => setF((c) => ({ ...c, from: e.target.value.replace(/[^\d-]/g, "") }))} />
              </div>
              <div className="field">
                <label htmlFor="yt">إلى</label>
                <input className="input tnum" id="yt" inputMode="numeric" placeholder={String(new Date().getFullYear())} value={f.to} onChange={(e) => setF((c) => ({ ...c, to: e.target.value.replace(/[^\d-]/g, "") }))} />
              </div>
            </div>
          </div>
          <div className="facet">
            <h3>اللغة</h3>
            <div className="chips">
              {languages.map((l) => (
                <button key={l} type="button" className="chip" aria-pressed={f.language.includes(l)} onClick={() => toggle("language", l)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="fsheet-foot">
            <button type="button" className="btn btn-primary" onClick={() => setSheet(false)}>
              عرض {results.length} {booksWord(results.length)}
            </button>
          </div>
        </aside>
        {sheet && <div className="scrim" onClick={() => setSheet(false)} />}

        <section aria-live="polite">
          <div className="results-bar">
            <button type="button" className="btn btn-ghost btn-sm fbtn" onClick={() => setSheet(true)}>
              <FilterIcon /> الفلاتر{activeCount ? ` (${activeCount})` : ""}
            </button>
            <div className="count tnum">
              {results.length} {booksWord(results.length)}{" "}
              {(q || activeCount > 0) && <span>من أصل {books.length}</span>}
            </div>
            <label className="sort">
              ترتيب حسب
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="added">أُضيف حديثًا</option>
                <option value="new">الأحدث نشرًا</option>
                <option value="old">الأقدم نشرًا</option>
                <option value="title">العنوان (أ–ي)</option>
              </select>
            </label>
          </div>

          {tags.length > 0 && (
            <div className="active">
              {tags.map((t) => (
                <span key={t.label + t.value} className="tag">
                  <i>{t.label}:</i> {t.value}
                  <button type="button" onClick={t.remove} aria-label={`إزالة ${t.label} ${t.value}`}><XIcon /></button>
                </span>
              ))}
            </div>
          )}

          {results.length > 0 ? (
            <div className="grid">
              {results.map((b) => <BookCard key={b.id} book={b} q={q} scope={scope} />)}
            </div>
          ) : books.length === 0 ? (
            <div className="empty">
              <h3>الفهرس فارغ حاليًا</h3>
              <p>لم تُضف أي كتب بعد. تابعنا قريبًا لتصفّح مجموعتنا.</p>
            </div>
          ) : (
            <div className="empty">
              <h3>لا توجد كتب تطابق هذا البحث</h3>
              <p>
                {q
                  ? `لم نجد «${q}»${activeCount ? " مع الفلاتر المختارة" : ""}. جرّب كلمة أقصر أو البحث في «الكل».`
                  : "لا يوجد كتاب يحقق كل الفلاتر معًا. أزل أحد الفلاتر لتوسيع النتائج."}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {activeCount > 0 && <button type="button" className="btn btn-ghost" onClick={clearFilters}>مسح الفلاتر</button>}
                {q && <button type="button" className="btn btn-primary" onClick={clearQuery}>مسح البحث</button>}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
