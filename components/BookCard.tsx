import Link from "next/link";
import type { CatalogBook } from "@/lib/types";
import { formatYear } from "@/lib/text";
import Cover from "./Cover";
import Highlight from "./Highlight";

type Scope = "all" | "title" | "author" | "publisher";

export default function BookCard({ book, q = "", scope = "all" }: { book: CatalogBook; q?: string; scope?: Scope }) {
  const hit = (s: Scope) => (scope === "all" || scope === s ? q : "");
  return (
    <Link href={`/books/${book.id}`} className="card" aria-label={`${book.title} — ${book.author.name}`}>
      <Cover book={book} />
      <div className="t"><Highlight text={book.title} q={hit("title")} /></div>
      <div className="a"><Highlight text={book.author.name} q={hit("author")} /></div>
      <div className="m">
        <span><Highlight text={book.publisher.name} q={hit("publisher")} /></span>
        <span className="tnum">{formatYear(book.publish_year)}</span>
      </div>
    </Link>
  );
}
