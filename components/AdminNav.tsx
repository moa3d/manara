"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Counts = { books: number; authors: number; publishers: number; categories: number };

const ITEMS: { href: string; label: string; key: keyof Counts }[] = [
  { href: "/admin", label: "الكتب", key: "books" },
  { href: "/admin/authors", label: "المؤلفون", key: "authors" },
  { href: "/admin/publishers", label: "دور النشر", key: "publishers" },
  { href: "/admin/categories", label: "التصنيفات", key: "categories" },
];

export default function AdminNav({ counts, signOut }: { counts: Counts; signOut: () => Promise<void> }) {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? path === "/admin" || path.startsWith("/admin/books") : path.startsWith(href);
  return (
    <nav className="side" aria-label="أقسام لوحة التحكم">
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} aria-current={isActive(it.href) ? "page" : undefined}>
          {it.label}
          <span className="n tnum">{counts[it.key]}</span>
        </Link>
      ))}
      <hr />
      <form action={signOut}><button>تسجيل الخروج</button></form>
    </nav>
  );
}
