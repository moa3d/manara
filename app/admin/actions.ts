"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { COVER_PALETTE, TERM_META, type Term, type TermKind } from "@/lib/types";
import { cleanIsbn, COVER_TYPES, MAX_COVER_BYTES, readBook, validateBook, type BookInput, type FieldErrors } from "@/lib/validate";
import { normalizeAr } from "@/lib/text";

const KINDS: TermKind[] = ["authors", "publishers", "categories"];
const withMsg = (path: string, msg: string) => `${path}?msg=${encodeURIComponent(msg)}`;
const NOT_ADMIN = "حسابك ليس له صلاحية المدير. اطلب من مسؤول النظام إضافتك.";

function coverPath(url: string | null | undefined) {
  if (!url) return null;
  const i = url.indexOf("/covers/");
  return i >= 0 ? url.slice(i + "/covers/".length) : null;
}

// ============ الكتب ============

export type BookFormState = { errors: FieldErrors; values?: BookInput };

export async function saveBook(_prev: BookFormState, fd: FormData): Promise<BookFormState> {
  const { supabase, isAdmin } = await requireAdmin();
  const values = readBook(fd);
  if (!isAdmin) return { errors: { form: NOT_ADMIN }, values };

  const id = Number(fd.get("id")) || null;
  const errors = validateBook(values);

  const file = fd.get("cover");
  const hasFile = file instanceof File && file.size > 0;
  if (hasFile) {
    if (!COVER_TYPES.includes(file.type)) errors.cover = "صورة الغلاف يجب أن تكون JPG أو PNG أو WebP.";
    else if (file.size > MAX_COVER_BYTES) errors.cover = "حجم الصورة أكبر من 2 ميغابايت. اختر صورة أصغر.";
  }
  if (Object.keys(errors).length) return { errors, values };

  // الغلاف الحالي (عند التعديل)
  let coverUrl: string | null = null;
  let oldCover: string | null = null;
  if (id) {
    const { data } = await supabase.from("books").select("cover_url").eq("id", id).maybeSingle();
    if (!data) return { errors: { form: "هذا الكتاب لم يعد موجودًا في الفهرس." }, values };
    coverUrl = data.cover_url;
    oldCover = data.cover_url;
  }
  if (fd.get("remove_cover") === "1") coverUrl = null;

  if (hasFile) {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("covers").upload(path, file, { contentType: file.type });
    if (up.error) return { errors: { cover: `تعذّر رفع الصورة: ${up.error.message}` }, values };
    coverUrl = supabase.storage.from("covers").getPublicUrl(path).data.publicUrl;
  }

  const record = {
    title: values.title,
    author_id: Number(values.author_id),
    publisher_id: Number(values.publisher_id),
    category_id: Number(values.category_id),
    publish_year: Number(values.publish_year),
    language: values.language,
    pages: values.pages ? Number(values.pages) : null,
    isbn: cleanIsbn(values.isbn) || null,
    description: values.description || null,
    shelf_code: values.shelf_code || null,
    cover_url: coverUrl,
  };

  const res = id
    ? await supabase.from("books").update(record).eq("id", id).select("id").single()
    : await supabase.from("books").insert(record).select("id").single();

  if (res.error) {
    if (res.error.code === "23505") return { errors: { isbn: "يوجد كتاب آخر بنفس رقم ISBN." }, values };
    if (res.error.code === "23503") return { errors: { form: "الكاتب أو دار النشر أو التصنيف المختار لم يعد موجودًا. اختر غيره." }, values };
    return { errors: { form: `تعذّر حفظ الكتاب: ${res.error.message}` }, values };
  }

  // حذف الصورة القديمة إن استُبدلت أو أزيلت
  const oldPath = coverPath(oldCover);
  if (oldPath && oldCover !== coverUrl) await supabase.storage.from("covers").remove([oldPath]);

  revalidatePath("/");
  revalidatePath(`/books/${res.data.id}`);
  revalidatePath("/admin");
  redirect(withMsg("/admin", id ? `حُفظت تعديلات «${record.title}»` : `أُضيف «${record.title}» إلى الفهرس`));
}

export async function deleteBook(fd: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect(withMsg("/admin", NOT_ADMIN));
  const id = Number(fd.get("id"));
  const { data, error } = await supabase.from("books").delete().eq("id", id).select("title,cover_url").maybeSingle();
  if (error) redirect(withMsg("/admin", `تعذّر حذف الكتاب: ${error.message}`));
  const p = coverPath(data?.cover_url);
  if (p) await supabase.storage.from("covers").remove([p]);
  revalidatePath("/");
  revalidatePath("/admin");
  redirect(withMsg("/admin", data ? `حُذف «${data.title}»` : "الكتاب محذوف مسبقًا"));
}

// ============ الكتّاب ودور النشر والتصنيفات ============

export type TermResult = { ok: true; term: Term } | { ok: false; error: string };

/** تُستخدم من صفحة الإدارة ومن داخل نموذج الكتاب ("كاتب جديد…") */
export async function createTerm(kind: TermKind, rawName: string): Promise<TermResult> {
  if (!KINDS.includes(kind)) return { ok: false, error: "نوع غير معروف." };
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { ok: false, error: NOT_ADMIN };
  const name = rawName.trim().replace(/\s+/g, " ");
  const one = TERM_META[kind].one;
  if (!name) return { ok: false, error: `اكتب اسم ${one} أولًا.` };

  const { data: existing } = await supabase.from(kind).select("id,name");
  const dup = (existing ?? []).find((x) => normalizeAr(x.name) === normalizeAr(name));
  if (dup) return { ok: true, term: dup as Term };

  const row: { name: string; color?: string } = { name };
  if (kind === "categories") row.color = COVER_PALETTE[(existing?.length ?? 0) % COVER_PALETTE.length];
  const { data, error } = await supabase.from(kind).insert(row).select("id,name").single();
  if (error) return { ok: false, error: `تعذّر إضافة ${one}: ${error.message}` };
  revalidatePath(`/admin/${kind}`);
  revalidatePath("/");
  return { ok: true, term: data as Term };
}

export type TermFormState = { error?: string; done?: string };

export async function addTermAction(kind: TermKind, _prev: TermFormState, fd: FormData): Promise<TermFormState> {
  const name = String(fd.get("name") ?? "");
  const before = await existsByName(kind, name);
  if (before) return { error: `«${name.trim()}» موجود مسبقًا في القائمة.` };
  const r = await createTerm(kind, name);
  return r.ok ? { done: `أُضيف «${r.term.name}»` } : { error: r.error };
}

async function existsByName(kind: TermKind, name: string) {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from(kind).select("name");
  return (data ?? []).some((x) => normalizeAr(x.name) === normalizeAr(name) && normalizeAr(name) !== "");
}

export async function renameTermAction(kind: TermKind, _prev: TermFormState, fd: FormData): Promise<TermFormState> {
  if (!KINDS.includes(kind)) return { error: "نوع غير معروف." };
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: NOT_ADMIN };
  const id = Number(fd.get("id"));
  const name = String(fd.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (!name) return { error: "الاسم لا يمكن أن يكون فارغًا." };
  const { error } = await supabase.from(kind).update({ name }).eq("id", id);
  if (error) return { error: error.code === "23505" ? `«${name}» موجود مسبقًا.` : error.message };
  revalidatePath(`/admin/${kind}`);
  revalidatePath("/");
  return { done: "حُفظ الاسم الجديد" };
}

export async function deleteTermAction(kind: TermKind, _prev: TermFormState, fd: FormData): Promise<TermFormState> {
  if (!KINDS.includes(kind)) return { error: "نوع غير معروف." };
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) return { error: NOT_ADMIN };
  const id = Number(fd.get("id"));
  const { data, error } = await supabase.from(kind).delete().eq("id", id).select("name").maybeSingle();
  if (error) {
    return {
      error: error.code === "23503"
        ? `لا يمكن حذف هذا ${TERM_META[kind].one} لأن له كتبًا في الفهرس. انقل الكتب إلى غيره أولًا.`
        : error.message,
    };
  }
  revalidatePath(`/admin/${kind}`);
  revalidatePath("/");
  return { done: data ? `حُذف «${data.name}»` : "محذوف مسبقًا" };
}

// ============ الجلسة ============

export async function signOut() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
