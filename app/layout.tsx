import type { Metadata } from "next";
import { Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const book = Amiri({ weight: ["400", "700"], subsets: ["arabic"], variable: "--font-book", display: "swap" });
const ui = IBM_Plex_Sans_Arabic({ weight: ["400", "500", "600", "700"], subsets: ["arabic"], variable: "--font-ui", display: "swap" });

export const metadata: Metadata = {
  title: { default: "دار الرموز العربية", template: "%s — دار الرموز العربية" },
  description: "الفهرس الإلكتروني لدار الرموز العربية، مكتبة ورواق ثقافي: ابحث عن الكتب بالعنوان أو الكاتب أو دار النشر.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${book.variable} ${ui.variable}`}>
      <body>
        <div className="app">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
