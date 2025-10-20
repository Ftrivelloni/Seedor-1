import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  DEMO_SESSION_COOKIE,
  DEMO_FLAG_COOKIE,
  DEMO_USER,
  isDemoSessionToken,
} from "@/lib/demo/shared";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(DEMO_SESSION_COOKIE);
  const demoFlag = cookieStore.get(DEMO_FLAG_COOKIE);

  if (!sessionCookie || !demoFlag || !isDemoSessionToken(sessionCookie.value)) {
    return NextResponse.json({ error: "Demo session not active" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      ...DEMO_USER,
      tenant: {
        ...DEMO_USER.tenant,
      },
      memberships: DEMO_USER.memberships?.map((m) => ({ ...m })),
    },
  });
}
