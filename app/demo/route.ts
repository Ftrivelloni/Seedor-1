import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import {
  DEMO_SESSION_COOKIE,
  DEMO_FLAG_COOKIE,
  DEMO_SESSION_PREFIX,
} from "../../lib/demo/shared";

export function GET(request: NextRequest) {
  const token = `${DEMO_SESSION_PREFIX}${randomUUID()}`;
  const redirectUrl = new URL("/home", request.url);

  const response = NextResponse.redirect(redirectUrl, { status: 302 });

  // Borrar las cookies de autenticación de Supabase para evitar conflictos
  const supabaseCookies = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'sb-localhost-auth-token',
    'sb-localhost-auth-token-code-verifier'
  ];

  supabaseCookies.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  });

  response.cookies.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60, // 1 hora
  });

  response.cookies.set(DEMO_FLAG_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}
