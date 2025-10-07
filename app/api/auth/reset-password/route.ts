import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token, password } = (await req.json()) as { token?: string; password?: string };

    if (!token || !password) {
      return NextResponse.json({ message: "Token y contraseña son requeridos" }, { status: 400 });
    }

    if (process.env.AUTH_ENDPOINT) {
      const r = await fetch(`${process.env.AUTH_ENDPOINT}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        return NextResponse.json({ message: (data as any)?.message || "No se pudo restablecer" }, { status: r.status });
      }
      return NextResponse.json({ ok: true });
    }

    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
  }
}
