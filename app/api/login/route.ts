import { NextResponse } from "next/server";

const SESSION_COOKIE = "portal_session";

export async function POST(request: Request) {
  const { password } = await request.json();

  // TEMPORARY debug: reports *why* login is failing, not the actual secret values.
  if (!process.env.PORTAL_PASSWORD) {
    return NextResponse.json(
      { error: "DEBUG: PORTAL_PASSWORD is not set on the server." },
      { status: 500 }
    );
  }
  if (!process.env.PORTAL_SESSION_SECRET) {
    return NextResponse.json(
      { error: "DEBUG: PORTAL_SESSION_SECRET is not set on the server." },
      { status: 500 }
    );
  }

  if (!password || password !== process.env.PORTAL_PASSWORD) {
    return NextResponse.json(
      {
        error: `DEBUG: password mismatch. You typed ${password?.length ?? 0} characters; server expects ${process.env.PORTAL_PASSWORD.length} characters.`,
      },
      { status: 401 }
    );
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
