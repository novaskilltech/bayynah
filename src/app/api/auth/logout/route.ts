import { NextResponse } from "next/server";
import { SESSION_CONFIG } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_CONFIG.COOKIE_NAME);
  return response;
}
