"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const inAdmin = usePathname().startsWith("/admin");
  return (
    <header className="top">
      <Link href="/" className="brand" aria-label="دار الرموز العربية — الفهرس">
        <Image src="/logo.png" alt="" width={48} height={48} priority />
        <span><b>دار الرموز العربية</b><small>مكتبة ورواق ثقافي</small></span>
      </Link>
      {/* لوحة التحكم لا تظهر لزوار الفهرس؛ يصلها المدير مباشرة عبر ‎/admin‎ */}
      {inAdmin && (
        <nav className="nav" aria-label="التنقل الرئيسي">
          <Link href="/">الفهرس</Link>
          <Link href="/admin" aria-current="page">لوحة التحكم</Link>
        </nav>
      )}
    </header>
  );
}
