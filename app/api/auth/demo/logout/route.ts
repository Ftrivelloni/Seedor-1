import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE, DEMO_FLAG_COOKIE } from "@/lib/demo/shared";

export async function POST() {
  const cookieStore = await cookies();
  const response = NextResponse.json({ ok: true });

  cookieStore.delete(DEMO_SESSION_COOKIE);
  cookieStore.delete(DEMO_FLAG_COOKIE);

  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(DEMO_FLAG_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
