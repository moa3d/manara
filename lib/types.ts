export type Term = { id: number; name: string };
export type Category = Term & { color: string };
export type TermKind = "authors" | "publishers" | "categories";

export type Book = {
  id: number;
  title: string;
  author_id: number;
  publisher_id: number;
  category_id: number;
  publish_year: number;
  language: string;
  pages: number | null;
  isbn: string | null;
  description: string | null;
  cover_url: string | null;
  shelf_code: string | null;
  created_at: string;
  author: Term;
  publisher: Term;
  category: Category;
};

/** نسخة خفيفة للفهرس: بدون الوصف */
export type CatalogBook = Omit<Book, "description" | "shelf_code">;

export const BOOK_SELECT =
  "*, author:authors(id,name), publisher:publishers(id,name), category:categories(id,name,color)";
export const CATALOG_SELECT =
  "id,title,author_id,publisher_id,category_id,publish_year,language,pages,isbn,cover_url,created_at," +
  "author:authors(id,name), publisher:publishers(id,name), category:categories(id,name,color)";

export const LANGUAGES = ["العربية", "الإنجليزية", "الفرنسية", "الألمانية", "التركية"];

export const TERM_META: Record<TermKind, { title: string; one: string; placeholder: string; fk: keyof Book }> = {
  authors: { title: "المؤلفون", one: "كاتب", placeholder: "اسم الكاتب، مثال: نجيب محفوظ", fk: "author_id" },
  publishers: { title: "دور النشر", one: "دار نشر", placeholder: "اسم دار النشر، مثال: دار الساقي", fk: "publisher_id" },
  categories: { title: "التصنيفات", one: "تصنيف", placeholder: "اسم التصنيف، مثال: شعر", fk: "category_id" },
};

export const COVER_PALETTE = [
  "#7A2E2E", "#6B4A22", "#22375A", "#4E3A5E", "#2E5A43", "#1F4F5A",
  "#4A5561", "#5E6232", "#7A4B5C", "#3A3A3A", "#8A5A2A", "#2F4858",
];
