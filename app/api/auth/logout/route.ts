import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // ⬇️ Next 15: cookies() es async
  const cookieStore = await cookies();
  cookieStore.delete("seedor_session");
  return NextResponse.json({ ok: true });
}
