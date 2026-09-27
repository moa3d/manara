import { Suspense } from "react";
import AdminNav from "@/components/AdminNav";
import Flash from "@/components/Flash";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return (
      <div className="notice" role="alert">
        <h1>لا تملك صلاحية المدير</h1>
        <p>سجّلت الدخول باسم <span dir="ltr">{user.email}</span>، لكن هذا الحساب غير مسجّل كمدير للمكتبة.</p>
        <p className="hint">أضفه من Supabase SQL Editor بالأمر الموجود في ملف README.</p>
        <form action={signOut}><button className="btn btn-ghost">تسجيل الخروج</button></form>
      </div>
    );
  }

  const count = async (t: string) => (await supabase.from(t).select("id", { count: "exact", head: true })).count ?? 0;
  const [books, authors, publishers, categories] = await Promise.all(
    ["books", "authors", "publishers", "categories"].map(count),
  );

  return (
    <div className="dash">
      <AdminNav counts={{ books, authors, publishers, categories }} signOut={signOut} />
      <main>{children}</main>
      <Suspense><Flash /></Suspense>
    </div>
  );
}
