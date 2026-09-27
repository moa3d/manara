/**
 * توحيد النص العربي قبل المقارنة:
 * أ إ آ ٱ ← ا ، ة ← ه ، ى ← ي ، ؤ ← و ، ئ ← ي ، وحذف التشكيل والتطويل.
 */
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

export function normalizeAr(s: string | null | undefined): string {
  return fold(String(s ?? "")).replace(/\s+/g, " ").trim();
}

/** يقسم النص إلى أجزاء لتظليل الجزء المطابق مع احترام التوحيد */
export function splitMatch(text: string, q: string): [string, string, string] | null {
  const n = normalizeAr(q);
  if (!n) return null;
  const map: number[] = [];
  let flat = "";
  for (let i = 0; i < text.length; i++) {
    for (const ch of fold(text[i])) {
      flat += ch;
      map.push(i);
    }
  }
  const k = flat.indexOf(n);
  if (k < 0) return null;
  const s = map[k];
  const e = map[k + n.length - 1] + 1;
  return [text.slice(0, s), text.slice(s, e), text.slice(e)];
}

export const formatYear = (y: number) => (y < 0 ? `${-y} ق.م` : String(y));

export const formatIsbn = (s: string) =>
  s.length === 13 ? `${s.slice(0, 3)}-${s.slice(3, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12)}` : s;

export const booksWord = (n: number) => (n === 1 ? "كتاب" : n === 2 ? "كتابان" : n >= 3 && n <= 10 ? "كتب" : "كتابًا");
