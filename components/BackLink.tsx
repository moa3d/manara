"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BackIcon } from "./Icons";

export const LAST_CATALOG_KEY = "manara:lastCatalog";

/** يعود إلى الفهرس بنفس البحث والفلاتر التي تركها المستخدم */
export default function BackLink({ children }: { children: React.ReactNode }) {
  const [href, setHref] = useState("/");
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(LAST_CATALOG_KEY);
      if (saved && saved.startsWith("/")) setHref(saved);
    } catch {
      /* التخزين غير متاح: نكتفي بالفهرس */
    }
  }, []);
  return <Link href={href} className="back"><BackIcon /> {children}</Link>;
}
