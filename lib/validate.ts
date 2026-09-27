export type BookInput = {
  title: string;
  author_id: string;
  publisher_id: string;
  category_id: string;
  publish_year: string;
  language: string;
  pages: string;
  isbn: string;
  description: string;
  shelf_code: string;
};

export type FieldErrors = Partial<Record<keyof BookInput | "cover" | "form", string>>;

export function readBook(fd: FormData): BookInput {
  const g = (k: string) => String(fd.get(k) ?? "").trim();
  return {
    title: g("title"),
    author_id: g("author_id"),
    publisher_id: g("publisher_id"),
    category_id: g("category_id"),
    publish_year: g("publish_year"),
    language: g("language") || "العربية",
    pages: g("pages"),
    isbn: g("isbn"),
    description: g("description"),
    shelf_code: g("shelf_code"),
  };
}

export const cleanIsbn = (s: string) => s.replace(/[\s-]/g, "").toUpperCase();

export function validateBook(v: BookInput): FieldErrors {
  const e: FieldErrors = {};
  const now = new Date().getFullYear();
  const y = Number(v.publish_year);
  const isbn = cleanIsbn(v.isbn);
  if (!v.title) e.title = "اكتب اسم الكتاب.";
  else if (v.title.length > 200) e.title = "اسم الكتاب أطول من 200 حرف.";
  if (!v.author_id) e.author_id = "اختر الكاتب أو أضف كاتبًا جديدًا.";
  if (!v.publisher_id) e.publisher_id = "اختر دار النشر أو أضف دارًا جديدة.";
  if (!v.category_id) e.category_id = "اختر التصنيف.";
  if (!v.publish_year || !Number.isInteger(y) || y > now || y < -3000) e.publish_year = `اكتب سنة صحيحة لا تتجاوز ${now}.`;
  if (v.pages && (!/^\d+$/.test(v.pages) || Number(v.pages) < 1)) e.pages = "عدد الصفحات رقم أكبر من صفر.";
  if (isbn && !/^(\d{9}[\dX]|\d{13})$/.test(isbn)) e.isbn = "رقم ISBN يتكون من 10 أو 13 رقمًا.";
  if (v.description.length > 1000) e.description = "الوصف أطول من 1000 حرف.";
  return e;
}

export const MAX_COVER_BYTES = 2 * 1024 * 1024;
export const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
