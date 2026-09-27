"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** رسالة تأكيد قصيرة تأتي عبر ?msg= بعد الحفظ أو الحذف */
export default function Flash() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const msg = params.get("msg");
  const [shown, setShown] = useState<string | null>(null);

  useEffect(() => {
    if (!msg) return;
    setShown(msg);
    const next = new URLSearchParams(params.toString());
    next.delete("msg");
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
    const t = setTimeout(() => setShown(null), 4000);
    return () => clearTimeout(t);
  }, [msg, params, path, router]);

  return shown ? <div className="flash" role="status">{shown}</div> : null;
}
