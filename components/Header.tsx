"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Icons";

export default function Header() {
  const path = usePathname();
  const inAdmin = path.startsWith("/admin");
  return (
    <header className="top">
      <Link href="/" className="brand" aria-label="مكتبة المنارة — الفهرس">
        <Logo />
        <span><b>مكتبة المنارة</b><small>الفهرس الإلكتروني</small></span>
      </Link>
      <nav className="nav" aria-label="التنقل الرئيسي">
        <Link href="/" aria-current={!inAdmin ? "page" : undefined}>الفهرس</Link>
        <Link href="/admin" aria-current={inAdmin ? "page" : undefined}>لوحة التحكم</Link>
      </nav>
    </header>
  );
}
