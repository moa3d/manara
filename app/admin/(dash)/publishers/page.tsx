import type { Metadata } from "next";
import TermsPage from "@/components/TermsPage";

export const metadata: Metadata = { title: "دور النشر" };

export default function Page() {
  return <TermsPage kind="publishers" />;
}
