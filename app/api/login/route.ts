import { NextResponse } from "next/server";

const SESSION_COOKIE = "portal_session";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!password || password !== process.env.PORTAL_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, process.env.PORTAL_SESSION_SECRET ?? "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
