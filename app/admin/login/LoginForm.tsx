"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) {
      setError("أدخل البريد الإلكتروني وكلمة المرور.");
      return;
    }
    setPending(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setPending(false);
      setError(
        error.message.includes("Invalid login")
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقق منهما وحاول مرة أخرى."
          : `تعذّر تسجيل الدخول: ${error.message}`,
      );
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="login" onSubmit={onSubmit} noValidate>
      <h1>دخول مدير المكتبة</h1>
      <p>لإضافة الكتب وتعديلها وإدارة الكتّاب ودور النشر والتصنيفات.</p>
      <div className="field">
        <label htmlFor="email">البريد الإلكتروني</label>
        <input className="input" id="email" name="email" type="email" autoComplete="username" dir="ltr" aria-invalid={!!error} />
      </div>
      <div className="field">
        <label htmlFor="password">كلمة المرور</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" dir="ltr" aria-invalid={!!error} />
      </div>
      <div className="err" role="alert">{error}</div>
      <button className="btn btn-primary" disabled={pending}>{pending ? "جارٍ الدخول…" : "تسجيل الدخول"}</button>
    </form>
  );
}
