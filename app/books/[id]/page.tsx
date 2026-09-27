import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookCard from "@/components/BookCard";
import Cover from "@/components/Cover";
import BackLink from "@/components/BackLink";
import { createClient } from "@/lib/supabase/server";
import { formatIsbn, formatYear } from "@/lib/text";
import { BOOK_SELECT, CATALOG_SELECT, type Book, type CatalogBook } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

async function getBook(id: string) {
  if (!/^\d+$/.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("books").select(BOOK_SELECT).eq("id", Number(id)).maybeSingle();
  return data as unknown as Book | null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const book = await getBook((await params).id);
  return book ? { title: book.title, description: book.description ?? undefined } : { title: "الكتاب غير موجود" };
}

export default async function BookPage({ params }: Params) {
  const book = await getBook((await params).id);
  if (!book) notFound();

  const supabase = await createClient();
  const { data: sameAuthor } = await supabase
    .from("books").select(CATALOG_SELECT)
    .eq("author_id", book.author_id).neq("id", book.id)
    .order("publish_year").limit(8);
  const more = (sameAuthor ?? []) as unknown as CatalogBook[];

  const filter = (k: string, v: number) => `/?${k}=${v}`;

  return (
    <>
      <BackLink>العودة إلى النتائج</BackLink>
      <article className="detail">
        <Cover book={book} size="lg" />
        <div>
          <h1>{book.title}</h1>
          <div className="byline">
            تأليف <Link className="link" href={filter("author", book.author_id)}>{book.author.name}</Link>
          </div>
          <p className="desc">
            {book.description || <span style={{ color: "var(--ink-3)" }}>لا يوجد وصف لهذا الكتاب بعد.</span>}
          </p>

          <section className="icard" aria-label="بطاقة الفهرسة">
            <div className="callno" title={book.shelf_code ? "رمز الرف" : "التصنيف"}>
              {book.category.name}
              {book.shelf_code && <><br />{book.shelf_code}</>}
            </div>
            <h2>بطاقة الفهرسة</h2>
            <dl>
              <dt>الكاتب</dt>
              <dd><Link className="link" href={filter("author", book.author_id)}>{book.author.name}</Link></dd>
              <dt>دار النشر</dt>
              <dd><Link className="link" href={filter("publisher", book.publisher_id)}>{book.publisher.name}</Link></dd>
              <dt>سنة النشر</dt>
              <dd><span className="tnum">{formatYear(book.publish_year)}</span></dd>
              <dt>التصنيف</dt>
              <dd><Link className="link" href={filter("category", book.category_id)}>{book.category.name}</Link></dd>
              <dt>عدد الصفحات</dt>
              {book.pages ? <dd><span className="tnum">{book.pages} صفحة</span></dd> : <dd className="none">غير محدد</dd>}
              <dt>اللغة</dt>
              <dd>{book.language}</dd>
              <dt>ISBN</dt>
              {book.isbn ? <dd className="ltr">{formatIsbn(book.isbn)}</dd> : <dd className="none">غير متوفر</dd>}
              {book.shelf_code && (<><dt>رمز الرف</dt><dd className="ltr">{book.shelf_code}</dd></>)}
            </dl>
          </section>
        </div>
      </article>

      {more.length > 0 && (
        <section className="more">
          <h2>كتب أخرى لـ{book.author.name}</h2>
          <div className="shelf">{more.map((b) => <BookCard key={b.id} book={b} />)}</div>
        </section>
      )}
    </>
  );
}
