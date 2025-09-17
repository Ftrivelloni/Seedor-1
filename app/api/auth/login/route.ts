import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string; remember?: boolean };
    const emailNormalized = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();
    const remember = Boolean(body.remember);

    if (!emailNormalized || !password) {
      return NextResponse.json({ message: "Email y contraseña son requeridos" }, { status: 400 });
    }

    let token: string | null = null;

    // Si hay backend real, delegamos
    if (process.env.AUTH_ENDPOINT) {
      const r = await fetch(`${process.env.AUTH_ENDPOINT}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNormalized, password }),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        return NextResponse.json(
          { message: (data as any)?.message || "Credenciales inválidas" },
          { status: r.status }
        );
      }
      const data = (await r.json().catch(() => ({}))) as any;
      token = data?.token || data?.accessToken || null;
    } else {
      // ------- MODO DEMO: acepta demo@seedor.com o cualquier @latoma.com con DEMO_PASSWORD -------
      const pass = process.env.DEMO_PASSWORD || "demo123";
      const okEmail =
        emailNormalized === "demo@seedor.com" || emailNormalized.endsWith("@latoma.com");

      if (okEmail && password === pass) {
        token = `demo-${Math.random().toString(36).slice(2)}`;
      } else {
        return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 });
      }
      // --------------------------------------------------------------------------------------------
    }

    if (!token) {
      return NextResponse.json({ message: "No se recibió token" }, { status: 500 });
    }

    // ⬇️ ⬇️ CAMBIO CLAVE EN NEXT 15: cookies() ahora es async
    const cookieStore = await cookies();
    cookieStore.set("seedor_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8, // 30 días o 8 hs
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
  }
}
