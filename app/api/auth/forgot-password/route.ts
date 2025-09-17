import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const emailNormalized = (email || "").toString().trim().toLowerCase();

    if (!emailNormalized) {
      return NextResponse.json({ message: "Email requerido" }, { status: 400 });
    }

    if (process.env.AUTH_ENDPOINT) {
      const r = await fetch(`${process.env.AUTH_ENDPOINT}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNormalized }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        return NextResponse.json({ message: (data as any)?.message || "No se pudo enviar el email" }, { status: r.status });
      }
      return NextResponse.json({ ok: true });
    }

    // DEMO: responder OK siempre
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Error inesperado" }, { status: 500 });
  }
}
