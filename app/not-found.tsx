import Link from "next/link";

export default function NotFound() {
  return (
    <div className="notice">
      <h1>هذه الصفحة غير موجودة</h1>
      <p>ربما حُذف الكتاب من الفهرس أو تغيّر الرابط.</p>
      <Link href="/" className="btn btn-primary" style={{ justifySelf: "start" }}>العودة إلى الفهرس</Link>
    </div>
  );
}
