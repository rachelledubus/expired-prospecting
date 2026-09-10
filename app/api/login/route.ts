import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/session";

const SESSION_COOKIE = "portal_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password || password !== process.env.PORTAL_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Portal session security is not configured." },
      { status: 500 }
    );
  }

  const sessionToken = await createSessionToken(secret, SESSION_MAX_AGE);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
