type CoverData = {
  title: string;
  cover_url?: string | null;
  author?: { name: string } | null;
  category?: { name: string; color: string } | null;
};

/** غلاف مولّد بلون التصنيف (قماش تجليد) أو صورة الغلاف المرفوعة */
export default function Cover({ book, size = "" }: { book: CoverData; size?: "" | "lg" | "xs" }) {
  const color = book.category?.color ?? "#444444";
  return (
    <div className={`cover ${size}`} style={{ "--c": color } as React.CSSProperties} aria-hidden="true">
      {book.cover_url ? <img src={book.cover_url} alt="" loading="lazy" /> : null}
      <div className="cc">{book.category?.name ?? ""}</div>
      <div className="ct">{book.title || "عنوان الكتاب"}</div>
      <div className="ca">{book.author?.name ?? ""}</div>
    </div>
  );
}
