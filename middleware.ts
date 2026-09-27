import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // الجلسة تهمّ لوحة التحكم فقط؛ صفحات الفهرس عامة
  matcher: ["/admin/:path*"],
};
