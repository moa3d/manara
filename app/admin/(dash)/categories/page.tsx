import type { Metadata } from "next";
import TermsPage from "@/components/TermsPage";

export const metadata: Metadata = { title: "التصنيفات" };

export default function Page() {
  return <TermsPage kind="categories" />;
}
