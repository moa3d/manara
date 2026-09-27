import { splitMatch } from "@/lib/text";

export default function Highlight({ text, q }: { text: string; q?: string }) {
  const parts = q ? splitMatch(text, q) : null;
  if (!parts) return <>{text}</>;
  return <>{parts[0]}<mark>{parts[1]}</mark>{parts[2]}</>;
}
